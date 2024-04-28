pub mod balance;
pub mod elgamal;
pub mod fixed_point;
pub mod keychain;
pub mod order;
pub mod transfers;
pub mod wallet;

use num_bigint::BigUint;
use num_traits::Num;
use serde::{de::Error as SerdeErr, Deserialize, Deserializer, Serialize, Serializer};

use self::wallet::Wallet;
use crate::{helpers::compute_poseidon_hash, types::Scalar, MAX_BALANCES, MAX_ORDERS};
use itertools::Itertools;

// -------------
// | Constants |
// -------------
// Subsctitution for SizedWalletShare::NUM_SCALARS
const NUM_SCALARS: usize = 54;

/// The type used to track an amount
pub type Amount = u128;

// --------------------------
// | Default Generic Values |
// --------------------------

/// A wallet with system-wide default generic parameters attached
pub type SizedWallet = Wallet<MAX_BALANCES, MAX_ORDERS>;

/// A helper to serialize a Scalar to a hex string
pub fn scalar_to_hex_string<S>(val: &Scalar, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    biguint_to_hex_string(&val.to_biguint(), s)
}

/// A helper to deserialize a Scalar from a hex string
pub fn scalar_from_hex_string<'de, D>(d: D) -> Result<Scalar, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(Scalar::from(biguint_from_hex_string(d)?))
}

/// A helper to serialize a BigUint to a hex string
pub fn biguint_to_hex_string<S>(val: &BigUint, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&format!("0x{}", val.to_str_radix(16 /* radix */)))
}

/// A helper to deserialize a BigUint from a hex string
pub fn biguint_from_hex_string<'de, D>(d: D) -> Result<BigUint, D::Error>
where
    D: Deserializer<'de>,
{
    // Deserialize as a string and remove "0x" if present
    let hex_string = String::deserialize(d)?;
    let hex_string = hex_string.strip_prefix("0x").unwrap_or(&hex_string);

    BigUint::from_str_radix(hex_string, 16 /* radix */)
        .map_err(|e| SerdeErr::custom(format!("error deserializing BigUint from hex string: {e}")))
}

/// A helper for serializing array types
pub fn serialize_array<const ARR_SIZE: usize, T, S>(
    arr: &[T; ARR_SIZE],
    s: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: Serialize + Clone,
    [(); ARR_SIZE]: Sized,
{
    // Convert the array to a vec
    let arr_vec: Vec<T> = arr.clone().into();
    arr_vec.serialize(s)
}

/// A helper for deserializing array types
pub fn deserialize_array<'de, const ARR_SIZE: usize, T, D>(d: D) -> Result<[T; ARR_SIZE], D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
    [(); ARR_SIZE]: Sized,
{
    // Deserialize a vec and then convert to an array
    let deserialized_vec: Vec<T> = Vec::deserialize(d)?;
    deserialized_vec
        .try_into()
        .map_err(|_| SerdeErr::custom("incorrect size of serialized array"))
}

// -----------------
// | Wallet Shares |
// -----------------

/// Compute a commitment to the shares of a wallet
pub fn compute_wallet_share_commitment<const MAX_BALANCES: usize, const MAX_ORDERS: usize>(
    public_shares: &Vec<Scalar>,
    private_shares: &Vec<Scalar>,
) -> Scalar
where
    [(); MAX_BALANCES + MAX_ORDERS]: Sized,
{
    // Hash the private input, then append the public input and re-hash
    let private_input_commitment = compute_wallet_private_share_commitment(private_shares);
    let mut hash_input = vec![private_input_commitment];
    hash_input.append(&mut public_shares.clone());

    compute_poseidon_hash(&hash_input)
}

/// Compute a commitment to a single share of a wallet
pub fn compute_wallet_private_share_commitment<const MAX_BALANCES: usize, const MAX_ORDERS: usize>(
    private_share: &Vec<Scalar>,
) -> Scalar
where
    [(); MAX_BALANCES + MAX_ORDERS]: Sized,
{
    compute_poseidon_hash(private_share)
}

/// Create a secret sharing of a wallet given the secret shares and blinders
pub fn create_wallet_shares_with_randomness<T, const MAX_BALANCES: usize, const MAX_ORDERS: usize>(
    wallet: &Wallet<MAX_BALANCES, MAX_ORDERS>,
    blinder: Scalar,
    private_blinder_share: Scalar,
    secret_shares: T,
) -> (Vec<Scalar>, Vec<Scalar>)
where
    T: IntoIterator<Item = Scalar>,
    [(); MAX_BALANCES + MAX_ORDERS]: Sized,
{
    let share_iter = secret_shares.into_iter();
    let wallet_scalars = wallet.to_scalars();
    let wallet_private_shares = share_iter.take(wallet_scalars.len()).collect_vec();
    let wallet_public_shares = wallet_scalars
        .iter()
        .zip_eq(wallet_private_shares.iter())
        .map(|(scalar, private_share)| *scalar - *private_share)
        .collect_vec();

    let mut private_shares = wallet_private_shares;
    let mut public_shares = wallet_public_shares;
    private_shares[NUM_SCALARS - 1] = private_blinder_share;
    public_shares[NUM_SCALARS - 1] = blinder - private_blinder_share;

    let blinded_public_shares = blind_shares(&mut public_shares, blinder);

    (private_shares, blinded_public_shares)
}

/// Construct public shares of a wallet given the private shares and blinder
///
/// The return type is a tuple containing the private and public shares.
/// Note that the private shares returned are exactly those passed in
pub fn create_wallet_shares_from_private<const MAX_BALANCES: usize, const MAX_ORDERS: usize>(
    wallet: &Wallet<MAX_BALANCES, MAX_ORDERS>,
    private_shares: &Vec<Scalar>,
    blinder: Scalar,
) -> (Vec<Scalar>, Vec<Scalar>)
where
    [(); MAX_BALANCES + MAX_ORDERS]: Sized,
{
    // Serialize the wallet's private shares and use this as the secret share stream
    let private_shares_ser: Vec<Scalar> = private_shares.clone();
    create_wallet_shares_with_randomness(
        wallet,
        blinder,
        private_shares[NUM_SCALARS - 1],
        private_shares_ser,
    )
}

/// Blinds the wallet, but does not blind the blinder itself
///
/// This is necessary because the default implementation of `blind` that is
/// derived by the macro will blind the blinder as well as the shares,
/// which is undesirable
pub fn blind_shares(shares: &mut Vec<Scalar>, blinder: Scalar) -> Vec<Scalar> {
    let prev_blinder = shares[NUM_SCALARS - 1];
    let mut blinded = shares.iter().map(|share| *share + blinder).collect_vec();
    blinded[NUM_SCALARS - 1] = prev_blinder;

    blinded
}

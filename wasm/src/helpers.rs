use ark_ec::{twisted_edwards::Projective, CurveGroup};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use itertools::Itertools;
use k256::ecdsa::SigningKey;
use num_bigint::BigUint;
use num_traits::Num;
use renegade_crypto::hash::Poseidon2Sponge;
use serde::{de::Error as SerdeErr, Deserialize, Deserializer, Serializer};

use crate::{
    circuit_types::{
        elgamal::BabyJubJubPoint,
        keychain::{NonNativeScalar, PublicSigningKey},
    },
    common::types::Wallet,
    external_api::types::ApiWallet,
    types::{biguint_to_scalar, scalar_to_biguint, Scalar},
};

// --------
// | Hash |
// --------

/// Compute the hash of the randomness of a given wallet
pub fn compute_poseidon_hash(values: &[Scalar]) -> Scalar {
    let input_seq = values.iter().map(Scalar::inner).collect_vec();
    let mut hasher = Poseidon2Sponge::new();
    let res = hasher.hash(&input_seq);

    Scalar::new(res)
}

/// Compute a chained Poseidon hash of the given length from the given seed
pub fn evaluate_hash_chain(seed: Scalar, length: usize) -> Vec<Scalar> {
    let mut seed = seed.inner();
    let mut res = Vec::with_capacity(length);

    for _ in 0..length {
        // Create a new hasher to reset the internal state
        let mut hasher = Poseidon2Sponge::new();
        seed = hasher.hash(&[seed]);

        res.push(Scalar::new(seed));
    }

    res
}

/// A hash chain from a seed used to compute CSPRNG values
pub struct PoseidonCSPRNG {
    /// The seed of the CSPRNG, this is chained into a hash function
    /// to give pseudorandom values
    state: Scalar,
}

impl PoseidonCSPRNG {
    /// Constructor
    pub fn new(seed: Scalar) -> Self {
        Self { state: seed }
    }
}

impl Iterator for PoseidonCSPRNG {
    type Item = Scalar;

    fn next(&mut self) -> Option<Self::Item> {
        let hash_res = compute_poseidon_hash(&[self.state]);
        self.state = hash_res;

        Some(hash_res)
    }
}

// -------
// | Hex |
// -------

/// Convert a byte array to a hex string
pub fn bytes_to_hex_string(bytes: &[u8]) -> String {
    let encoded = hex::encode(bytes);
    format!("0x{encoded}")
}

/// Convert a hex string to a byte array
pub fn bytes_from_hex_string(hex: &str) -> Result<Vec<u8>, String> {
    let hex = hex.strip_prefix("0x").unwrap_or(hex);
    hex::decode(hex).map_err(|e| format!("error deserializing bytes from hex string: {e}"))
}

/// A helper to serialize a BigUint to a hex string
pub fn biguint_to_hex_string(val: &BigUint) -> String {
    format!("0x{}", val.to_str_radix(16 /* radix */))
}

/// A helper to deserialize a BigUint from a hex string
pub fn biguint_from_hex_string(hex: &str) -> Result<BigUint, String> {
    // Deserialize as a string and remove "0x" if present
    let stripped = hex.strip_prefix("0x").unwrap_or(hex);
    BigUint::from_str_radix(stripped, 16 /* radix */)
        .map_err(|e| format!("error deserializing BigUint from hex string: {e}"))
}

/// A helper to serialize a scalar to a hex string
pub fn scalar_to_hex_string(val: &Scalar) -> String {
    let biguint = scalar_to_biguint(val);
    biguint_to_hex_string(&biguint)
}

/// A helper to deserialize a scalar from a hex string
pub fn scalar_from_hex_string(hex: &str) -> Result<Scalar, String> {
    let biguint = biguint_from_hex_string(hex)?;
    Ok(biguint_to_scalar(&biguint))
}

/// A helper to serialize a nonnative scalar to a hex string
pub fn nonnative_scalar_to_hex_string<const NUM_WORDS: usize>(
    val: &NonNativeScalar<NUM_WORDS>,
) -> String {
    biguint_to_hex_string(&val.into())
}

/// A helper method to deserialize a nonnative scalar from a hex string
pub fn nonnative_scalar_from_hex_string<const NUM_WORDS: usize>(
    hex: &str,
) -> Result<NonNativeScalar<NUM_WORDS>, String> {
    let biguint = biguint_from_hex_string(hex)?;
    Ok(NonNativeScalar::from(&biguint))
}

/// A helper to serialize a signing key to a hex string
pub fn public_sign_key_to_hex_string(val: &PublicSigningKey) -> String {
    let bytes = val.to_uncompressed_bytes();
    format!("0x{}", hex::encode(bytes))
}

/// A helper to deserialize a signing key from a hex string
pub fn public_sign_key_from_hex_string(hex: &str) -> Result<PublicSigningKey, String> {
    // Deserialize as a string and remove "0x" if present
    let stripped = hex.strip_prefix("0x").unwrap_or(hex);
    let bytes = hex::decode(stripped)
        .map_err(|e| format!("error deserializing bytes from hex string: {e}"))?;

    PublicSigningKey::from_bytes(&bytes)
        .map_err(|e| format!("error deserializing signing key from bytes: {e}"))
}

/// The config of the embedded curve
pub type EmbeddedCurveConfig = ark_ed_on_bn254::EdwardsConfig;
/// Convert a Baby-JubJub point to a hex string
pub fn jubjub_to_hex_string(point: &BabyJubJubPoint) -> String {
    let converted_point = Projective::<EmbeddedCurveConfig>::from(*point);
    let mut bytes = vec![];
    converted_point
        .into_affine()
        .serialize_uncompressed(&mut bytes)
        .unwrap();

    format!("0x{}", hex::encode(bytes))
}

/// Deserialize a Baby-JubJub point from a hex string
pub fn jubjub_from_hex_string(hex: &str) -> Result<BabyJubJubPoint, String> {
    // Deserialize as a string and remove "0x" if present
    let stripped = hex.strip_prefix("0x").unwrap_or(hex);
    let bytes = hex::decode(stripped)
        .map_err(|e| format!("error deserializing bytes from hex string: {e}"))?;

    let projective = Projective::<EmbeddedCurveConfig>::deserialize_uncompressed(bytes.as_slice())
        .map_err(|e| format!("error deserializing projective point from bytes: {:?}", e))?;
    Ok(projective.into())
}

/// A helper to serialize a BigUint to a hex string
pub fn serialize_biguint_to_hex_string<S>(val: &BigUint, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let hex = biguint_to_hex_string(val);
    serializer.serialize_str(&hex)
}

/// A helper to deserialize a BigUint from a hex string
pub fn deserialize_biguint_from_hex_string<'de, D>(deserializer: D) -> Result<BigUint, D::Error>
where
    D: Deserializer<'de>,
{
    let hex = String::deserialize(deserializer)?;
    biguint_from_hex_string(&hex).map_err(D::Error::custom)
}

// ---------------
// | Signing Key |
// ---------------
pub fn derive_signing_key_from_hex(sk_root: &str) -> Result<SigningKey, String> {
    let key_bigint = biguint_from_hex_string(sk_root).map_err(|e| e.to_string())?;
    SigningKey::from_slice(&key_bigint.to_bytes_be()).map_err(|e| e.to_string())
}

pub fn hex_to_signing_key(hex: &str) -> Result<SigningKey, String> {
    let stripped = hex.strip_prefix("0x").unwrap_or(hex);
    let padded = if stripped.len() < 64 {
        format!("{:0>64}", stripped)
    } else {
        stripped.to_string()
    };
    let bytes = hex::decode(padded).map_err(|e| e.to_string())?;
    SigningKey::from_slice(&bytes).map_err(|e| e.to_string())
}

// -----------------
// | Wallet Helpers |
// -----------------

/// Deserializes a JSON string into a `Wallet` object.
pub fn deserialize_wallet(wallet_str: &str) -> Wallet {
    let deserialized_wallet: ApiWallet = serde_json::from_reader(wallet_str.as_bytes()).unwrap();
    deserialized_wallet.try_into().unwrap()
}

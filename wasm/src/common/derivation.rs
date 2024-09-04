use crate::{
    circuit_types::keychain::{NonNativeScalar, PublicKeyChain, SecretIdentificationKey},
    external_api::types::ApiWallet,
    helpers::{hex_to_signing_key, nonnative_scalar_to_hex_string},
    types::Scalar,
};

use ethers::utils::keccak256;
use eyre::Result;
use k256::ecdsa::{signature::Signer, Signature, SigningKey};
use lazy_static::lazy_static;
use num_bigint::BigUint;
use num_traits::Num;

use super::{
    keychain::{HmacKey, KeyChain, PrivateKeyChain},
    types::{Wallet, WalletIdentifier},
};

/// The message used to derive the blinder stream seed
const BLINDER_STREAM_SEED_MESSAGE: &[u8] = b"blinder seed";
/// The messages used to derive the share stream seed
const SHARE_STREAM_SEED_MESSAGE: &[u8] = b"share seed";
/// The message (concatenated with the nonce) used to derive the wallet's root key
const ROOT_KEY_MESSAGE: &[u8] = b"root key";
/// The message used to derive the wallet's symmetric key
const SYMMETRIC_KEY_MESSAGE: &[u8] = b"symmetric key";
/// The message used to derive the wallet's match key
const MATCH_KEY_MESSAGE: &[u8] = b"match key";
/// The message used to derive the wallet's ID
const WALLET_ID_MESSAGE: &[u8] = b"wallet id";

/// The number of bytes from a keccak hash
const KECCAK_HASH_BYTES: usize = 32;
/// The number of bytes we extend into to get a scalar
const EXTENDED_BYTES: usize = 64;
/// The number of bytes in a wallet ID
const WALLET_ID_BYTES: usize = 16;

/// Derive the root key from a seed
/// "root key" is used to refer to the signing key that is used to derive the first sk_root key,
/// which is used to derive the wallet_id, the blinder_seed, and the share_seed
pub fn derive_root_signing_key(seed: &str) -> Result<SigningKey, String> {
    let stripped = seed.strip_prefix("0x").unwrap_or(seed);
    let bytes = hex::decode(stripped).unwrap();
    // Generate the root key
    let keccak_bytes = keccak256(bytes);
    let sig_bytes = extend_to_64_bytes(&keccak_bytes);

    // We must manually reduce the bytes to the base field as the k256 library
    // expects byte representations to be of a valid base field element directly
    let unreduced_val = BigUint::from_bytes_be(&sig_bytes);
    let reduced_val = unreduced_val % &*SECP256K1_SCALAR_MODULUS;

    // Convert the reduced value to a fixed 32-byte array, padding with zeros if necessary
    let mut key_bytes = [0u8; 32];
    let reduced_bytes = reduced_val.to_bytes_be();
    let start = 32 - reduced_bytes.len();
    key_bytes[start..].copy_from_slice(&reduced_bytes);

    SigningKey::from_bytes((&key_bytes).into())
        .map_err(|e| format!("failed to derive signing key from signature: {}", e))
}

/// Derive the sk_root signing key using the root key
/// The first sk_root key (not rotated) is used to derive wallet_id, the blinder_seed, and the share_seed
pub fn derive_sk_root_signing_key(
    seed: &str,
    nonce: Option<&Scalar>,
) -> Result<SigningKey, String> {
    let sk_root_scalar = derive_sk_root_scalars(seed, nonce.unwrap_or(&Scalar::zero()));
    let sk_root_hex = nonnative_scalar_to_hex_string(&sk_root_scalar);
    Ok(hex_to_signing_key(&sk_root_hex).unwrap())
}

/// Derive the sk_root scalar from the root key and nonce
pub fn derive_sk_root_scalars(seed: &str, nonce: &Scalar) -> NonNativeScalar<2> {
    let root_key = derive_root_signing_key(seed).unwrap();

    let sk_root = derive_sk_root(&root_key, Some(&nonce)).unwrap();
    let sk_root_biguint = BigUint::from_bytes_be(&sk_root.to_bytes_be());
    // TODO: Should be able to .into() here
    NonNativeScalar::from(&sk_root_biguint)
}

/// Construct sk_root by signing the concat of the root key message and the nonce
pub fn derive_sk_root(root_key: &SigningKey, nonce: Option<&Scalar>) -> Result<Scalar, String> {
    // Use the provided nonce or default to 0
    let default_nonce = Scalar::zero();
    let nonce = nonce.unwrap_or(&default_nonce);

    // Sign the concat of the root key message and the nonce and convert to a scalar
    let msg = [ROOT_KEY_MESSAGE, nonce.to_bytes_be().as_slice()].concat();
    derive_scalar(&msg, root_key)
}

/// Derive a symmetric key from a signing key
pub fn derive_symmetric_key(root_key: &SigningKey) -> Result<HmacKey, String> {
    get_sig_bytes(SYMMETRIC_KEY_MESSAGE, root_key).map(HmacKey)
}

lazy_static! {
    /// The secp256k1 scalar field modulus as a BigUint
    ///
    /// See https://en.bitcoin.it/wiki/Secp256k1 for more information
    static ref SECP256K1_SCALAR_MODULUS: BigUint = BigUint::from_str_radix(
        "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
        16,
    ).unwrap();
}

/// A helper to derive a wallet keychain from a given Ethereum keypair
///
/// This does not necessarily match the implementation used in the clients to
/// generate their wallets
pub fn derive_wallet_keychain(root_key: &SigningKey) -> Result<KeyChain, String> {
    // Generate the root key

    let sk_root = root_key.into();
    let pk_root = root_key.verifying_key().into();

    // Generate the match key, this time using the root key to derive it
    let sk_match_key = derive_scalar(MATCH_KEY_MESSAGE, root_key)?;
    let sk_match = SecretIdentificationKey::from(sk_match_key);
    let pk_match = sk_match.get_public_key();

    // Generate the symmetric key
    let symmetric_key = derive_symmetric_key(root_key)?;

    Ok(KeyChain {
        public_keys: PublicKeyChain::new(pk_root, pk_match),
        secret_keys: PrivateKeyChain {
            sk_root: Some(sk_root),
            sk_match,
            symmetric_key,
        },
    })
}

/// Construct the blinder seed for the wallet
pub fn derive_blinder_seed(root_key: &SigningKey) -> Result<Scalar, String> {
    // Sign the blinder seed message and convert to a scalar
    derive_scalar(BLINDER_STREAM_SEED_MESSAGE, root_key)
}

/// Construct the share seed for the wallet
pub fn derive_share_seed(root_key: &SigningKey) -> Result<Scalar, String> {
    // Sign the share seed message and convert to a scalar
    derive_scalar(SHARE_STREAM_SEED_MESSAGE, root_key)
}

/// Construct a wallet ID from the given Ethereum keypair
///
/// This is done to ensure deterministic wallet recovery
pub fn derive_wallet_id(root_key: &SigningKey) -> Result<WalletIdentifier, String> {
    let bytes = get_extended_sig_bytes(WALLET_ID_MESSAGE, root_key)?;
    WalletIdentifier::from_slice(&bytes[..WALLET_ID_BYTES])
        .map_err(|e| format!("failed to derive wallet ID from key: {}", e))
}

/// Derive a new wallet from a private key
///
/// Returns the wallet, the blinder seed, and the share seed
/// Should pass in first sk_root
pub fn derive_wallet_from_key(signing_key: &SigningKey) -> Result<(ApiWallet, Scalar, Scalar)> {
    // Derive the seeds and keychain
    let wallet_id = wrap_eyre!(derive_wallet_id(signing_key))?;
    let blinder_seed = wrap_eyre!(derive_blinder_seed(signing_key))?;
    let share_seed = wrap_eyre!(derive_share_seed(signing_key))?;
    let keychain = wrap_eyre!(derive_wallet_keychain(signing_key))?;

    let wallet = Wallet::new_empty_wallet(wallet_id, blinder_seed, share_seed, keychain);
    Ok((wallet.into(), blinder_seed, share_seed))
}

/// Get a `Scalar` from a signature on a message
fn derive_scalar(msg: &[u8], key: &SigningKey) -> Result<Scalar, String> {
    let bytes = get_extended_sig_bytes(msg, key)?;

    // TODO: Impelement Scalar::from_be_bytes_mod_order
    Ok(Scalar::from(BigUint::from_bytes_be(&bytes)))
}

/// Sign a message, serialize the signature into bytes
fn get_sig_bytes(msg: &[u8], key: &SigningKey) -> Result<[u8; KECCAK_HASH_BYTES], String> {
    let digest = keccak256(msg);
    let sig: Signature = key.sign(&digest);

    // Take the keccak hash of the signature to disperse its elements
    let bytes = sig.to_vec();
    Ok(keccak256(bytes))
}

/// Sign a message, serialize the signature into bytes, and extend the bytes to
/// support secure reduction into a field
fn get_extended_sig_bytes(msg: &[u8], key: &SigningKey) -> Result<[u8; EXTENDED_BYTES], String> {
    let bytes = get_sig_bytes(msg, key)?;
    Ok(extend_to_64_bytes(&bytes))
}

/// Extend the given byte array to 64 bytes, double the length of the original
///
/// This is necessary to give a uniform sampling of a field that these bytes are
/// reduced into, the bitlength must be significantly larger than the field's
/// bitlength to avoid sample bias via modular reduction
fn extend_to_64_bytes(bytes: &[u8]) -> [u8; EXTENDED_BYTES] {
    let mut extended = [0; EXTENDED_BYTES];
    let top_bytes = keccak256(bytes);
    extended[..KECCAK_HASH_BYTES].copy_from_slice(bytes);
    extended[KECCAK_HASH_BYTES..].copy_from_slice(&top_bytes);
    extended
}
/// Wraps an error in an `eyre::Report`
macro_rules! wrap_eyre {
    ($x:expr) => {
        $x.map_err(|err| eyre::eyre!(err.to_string()))
    };
}
pub(crate) use wrap_eyre;

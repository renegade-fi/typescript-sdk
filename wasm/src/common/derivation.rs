use crate::{
    circuit_types::keychain::{NonNativeScalar, PublicKeyChain, SecretIdentificationKey},
    external_api::types::ApiWallet,
    helpers::nonnative_scalar_to_hex_string,
    types::Scalar,
};


use ethers::utils::keccak256;
use eyre::Result;
use k256::{
    ecdsa::{signature::Signer, Signature, SigningKey},
};
use lazy_static::lazy_static;
use num_bigint::BigUint;
use num_traits::{Num};
use wasm_bindgen::prelude::*;

use super::types::{KeyChain, PrivateKeyChain, Wallet, WalletIdentifier};

/// The message used to derive the blinder stream seed
const BLINDER_STREAM_SEED_MESSAGE: &[u8] = b"blinder seed";
/// The messages used to derive the share stream seed
const SHARE_STREAM_SEED_MESSAGE: &[u8] = b"share seed";
/// The message used to derive the wallet's root key
const ROOT_KEY_MESSAGE_PREFIX: &str = "Unlock your Renegade Wallet on chain ID:";
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

#[wasm_bindgen]
pub fn derive_signing_key_from_seed(seed: &str) -> JsValue {
    let stripped = seed.strip_prefix("0x").unwrap_or(seed);
    let bytes = hex::decode(stripped).unwrap();
    // Generate the root key
    let sk_root_key = derive_signing_key(&bytes).unwrap();
    let bigint = BigUint::from_bytes_be(&sk_root_key.to_bytes());
    // TODO: Should be able to .into() here
    let sk_root: NonNativeScalar<2> = NonNativeScalar::from(&bigint);

    JsValue::from(nonnative_scalar_to_hex_string(&sk_root))
}

/// Derive a signing key from a signature on a message (message has already signed in the frontend)
/// Derives sk_root from seed (Signed root key message from browser wallet)
fn derive_signing_key(seed: &[u8]) -> Result<SigningKey, String> {
    let sig_bytes = get_extended_sig_bytes(seed)?;

    // We must manually reduce the bytes to the base field as the k256 library
    // expects byte representations to be of a valid base field element directly
    let unreduced_val = BigUint::from_bytes_be(&sig_bytes);
    let reduced_val = unreduced_val % &*SECP256K1_SCALAR_MODULUS;

    let key_bytes = reduced_val.to_bytes_be();
    SigningKey::from_bytes(key_bytes.as_slice().into())
        .map_err(|e| format!("failed to derive signing key from signature: {}", e))
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

    Ok(KeyChain {
        public_keys: PublicKeyChain { pk_root, pk_match },
        secret_keys: PrivateKeyChain {
            sk_root: Some(sk_root),
            sk_match,
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
    let sig: Signature = root_key.sign(WALLET_ID_MESSAGE);
    let bytes = get_extended_sig_bytes(&sig.to_bytes())?;
    WalletIdentifier::from_slice(&bytes[..WALLET_ID_BYTES])
        .map_err(|e| format!("failed to derive wallet ID from key: {}", e))
}

/// Derive a new wallet from a private key
///
/// Returns the wallet, the blinder seed, and the share seed
pub fn derive_wallet_from_key(root_key: &SigningKey) -> Result<(ApiWallet, Scalar, Scalar)> {
    // Derive the seeds and keychain
    let wallet_id = wrap_eyre!(derive_wallet_id(root_key))?;
    let blinder_seed = wrap_eyre!(derive_blinder_seed(root_key))?;
    let share_seed = wrap_eyre!(derive_share_seed(root_key))?;
    // TODO: Pass seed into here
    let keychain = wrap_eyre!(derive_wallet_keychain(root_key))?;

    let wallet = Wallet::new_empty_wallet(wallet_id, blinder_seed, share_seed, keychain);
    Ok((wallet.into(), blinder_seed, share_seed))
}

/// Get a `Scalar` from a signature on a message (message should already be signed)
fn derive_scalar(msg: &[u8], key: &SigningKey) -> Result<Scalar, String> {
    let sig: Signature = key.sign(msg);
    let bytes = get_extended_sig_bytes(&sig.to_bytes())?;

    // TODO: Impelement Scalar::from_be_bytes_mod_order
    Ok(Scalar::from(BigUint::from_bytes_be(&bytes)))
}

// Hash and extend a signature to 64 bytes
fn get_extended_sig_bytes(msg: &[u8]) -> Result<[u8; EXTENDED_BYTES], String> {
    // Take the keccak hash of the signature to disperse its elements
    let bytes = msg.to_vec();
    let keccak_bytes = keccak256(bytes);
    Ok(extend_to_64_bytes(&keccak_bytes))
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

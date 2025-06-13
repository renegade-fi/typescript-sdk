use itertools::Itertools;
use k256::{
    ecdsa::{SigningKey as K256SigningKey, VerifyingKey as K256VerifyingKey},
    elliptic_curve::sec1::{FromEncodedPoint, ToEncodedPoint},
    AffinePoint, EncodedPoint, FieldElement as K256FieldElement,
};
use num_bigint::BigUint;
use serde::{de::Error as SerdeErr, Deserialize, Serialize};
use std::iter;
use wasm_bindgen::JsError;

use crate::{
    helpers::compute_poseidon_hash,
    map_js_error,
    types::{get_scalar_field_modulus, Scalar},
};

use super::{
    biguint_from_hex_string, biguint_to_hex_string, scalar_from_hex_string, scalar_to_hex_string,
};

/// The number of keys held in a wallet's keychain
pub const NUM_KEYS: usize = 4;
/// The number of bytes used in a single scalar to represent a key
pub const SCALAR_MAX_BYTES: usize = 31;
/// The number of words needed to represent an element of k256's base field,
/// which is used to represent both public and private keys
const K256_FELT_WORDS: usize = 2;
/// The number of bytes in a k256 field element
const K256_FELT_BYTES: usize = 32;

/// A public identification key is the image-under-hash of the secret
/// identification key knowledge of which is proved in a circuit
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub struct PublicIdentificationKey {
    pub key: Scalar,
}

impl Serialize for PublicIdentificationKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        scalar_to_hex_string(&self.key, serializer)
    }
}

impl<'de> Deserialize<'de> for PublicIdentificationKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let scalar = scalar_from_hex_string(deserializer)?;
        Ok(Self { key: scalar })
    }
}

impl From<Scalar> for PublicIdentificationKey {
    fn from(key: Scalar) -> Self {
        Self { key }
    }
}

impl From<PublicIdentificationKey> for Scalar {
    fn from(val: PublicIdentificationKey) -> Self {
        val.key
    }
}

/// A secret identification key is the hash preimage of the public
/// identification key
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub struct SecretIdentificationKey {
    pub key: Scalar,
}

impl SecretIdentificationKey {
    /// Get the public key corresponding to this secret key
    pub fn get_public_key(&self) -> PublicIdentificationKey {
        let key = compute_poseidon_hash(&[self.key]);
        PublicIdentificationKey { key }
    }
}

impl Serialize for SecretIdentificationKey {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        scalar_to_hex_string(&self.key, serializer)
    }
}

impl<'de> Deserialize<'de> for SecretIdentificationKey {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let val = scalar_from_hex_string(deserializer)?;
        Ok(Self { key: val })
    }
}

impl From<Scalar> for SecretIdentificationKey {
    fn from(key: Scalar) -> Self {
        Self { key }
    }
}

impl From<SecretIdentificationKey> for Scalar {
    fn from(val: SecretIdentificationKey) -> Self {
        val.key
    }
}

/// A non-native scalar is an element of a non-native field
/// (i.e. not Bn254 scalar)
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct NonNativeScalar<const SCALAR_WORDS: usize> {
    /// The native `Scalar` words used to represent the scalar
    ///
    /// Because the scalar is an element of a non-native field, its
    /// representation requires a bigint-like approach
    pub scalar_words: [Scalar; SCALAR_WORDS],
}

impl<const SCALAR_WORDS: usize> Default for NonNativeScalar<SCALAR_WORDS> {
    fn default() -> Self {
        Self {
            scalar_words: [Scalar::zero(); SCALAR_WORDS],
        }
    }
}

impl<const SCALAR_WORDS: usize> NonNativeScalar<SCALAR_WORDS> {
    /// Split a biguint into scalar words in little endian order
    fn split_biguint_into_words(mut val: BigUint) -> Result<[Scalar; SCALAR_WORDS], JsError> {
        let scalar_mod = get_scalar_field_modulus();
        let mut res = Vec::with_capacity(SCALAR_WORDS);
        for _ in 0..SCALAR_WORDS {
            let word = Scalar::from(&val % &scalar_mod);
            val /= &scalar_mod;
            res.push(word);
        }

        res.try_into()
            .map_err(|_| JsError::new("Failed to convert vector to fixed-size array"))
    }

    /// Re-collect the key words into a biguint
    fn combine_words_into_biguint(&self) -> BigUint {
        let scalar_mod = get_scalar_field_modulus();
        self.scalar_words
            .iter()
            .rev()
            .fold(BigUint::from(0u8), |acc, word| {
                acc * &scalar_mod + word.to_biguint()
            })
    }
}

impl<const SCALAR_WORDS: usize> TryFrom<&BigUint> for NonNativeScalar<SCALAR_WORDS> {
    type Error = JsError;

    fn try_from(val: &BigUint) -> Result<Self, Self::Error> {
        Ok(Self {
            scalar_words: Self::split_biguint_into_words(val.clone())?,
        })
    }
}

impl<const SCALAR_WORDS: usize> From<&NonNativeScalar<SCALAR_WORDS>> for BigUint {
    fn from(value: &NonNativeScalar<SCALAR_WORDS>) -> Self {
        value.combine_words_into_biguint()
    }
}

impl<const SCALAR_WORDS: usize> Serialize for NonNativeScalar<SCALAR_WORDS> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        // Recover a bigint from the scalar words
        biguint_to_hex_string(&self.into(), serializer)
    }
}

impl<'de, const SCALAR_WORDS: usize> Deserialize<'de> for NonNativeScalar<SCALAR_WORDS> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let val = biguint_from_hex_string(deserializer)?;
        let scalar = Self::try_from(&val)
            .map_err(|_| SerdeErr::custom("Failed to convert BigUint to NonNativeScalar"))?;

        Ok(scalar)
    }
}

impl TryFrom<&NonNativeScalar<K256_FELT_WORDS>> for K256FieldElement {
    type Error = JsError;

    fn try_from(value: &NonNativeScalar<K256_FELT_WORDS>) -> Result<Self, Self::Error> {
        let val_bigint = BigUint::from(value);
        let mut bytes = val_bigint
            .to_bytes_le()
            .into_iter()
            .chain(iter::repeat(0))
            .take(K256_FELT_BYTES)
            .collect_vec();
        bytes.reverse();

        let bytes_arr: [u8; K256_FELT_BYTES] = bytes
            .try_into()
            .map_err(|_| JsError::new("Failed to convert bytes to array"))?;

        K256FieldElement::from_bytes(&bytes_arr.into())
            .into_option()
            .ok_or(JsError::new("Failed to create K256FieldElement from bytes"))
    }
}

impl TryFrom<&K256FieldElement> for NonNativeScalar<K256_FELT_WORDS> {
    type Error = JsError;

    fn try_from(value: &K256FieldElement) -> Result<Self, Self::Error> {
        let bytes = value.to_bytes();
        let val_bigint = BigUint::from_bytes_be(&bytes);

        Self::try_from(&val_bigint)
    }
}

// -----------------
// | Keychain Type |
// -----------------

#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct PublicSigningKey {
    /// The affine x-coordinate of the public key
    pub x: NonNativeScalar<K256_FELT_WORDS>,
    /// The affine y-coordinate of the public key
    pub y: NonNativeScalar<K256_FELT_WORDS>,
}

impl PublicSigningKey {
    /// Construct a key from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, JsError> {
        // Parse the encoded K256 point assumed to be compressed
        let point = EncodedPoint::from_bytes(bytes).map_err(map_js_error!("{}"))?;

        // Convert to circuit-native types, it is simpler to go through the whole
        // conversion than decompressing manually
        let verifying_key =
            K256VerifyingKey::from_encoded_point(&point).map_err(map_js_error!("{}"))?;
        (&verifying_key).try_into()
    }

    /// Convert the key to bytes
    pub fn to_uncompressed_bytes(&self) -> Result<Vec<u8>, JsError> {
        let verifying_key = K256VerifyingKey::try_from(self)?;

        let bytes = verifying_key
            .to_encoded_point(false /* compress */)
            .as_bytes()
            .to_vec();

        Ok(bytes)
    }
}

impl TryFrom<&PublicSigningKey> for K256VerifyingKey {
    type Error = JsError;

    fn try_from(value: &PublicSigningKey) -> Result<Self, JsError> {
        // Construct a point from the raw coordinates
        let x_coord = K256FieldElement::try_from(&value.x)?;
        let y_coord = K256FieldElement::try_from(&value.y)?;

        // `k256` does not expose direct access to coordinates except through a
        // compressed form
        let point = AffinePoint::from_encoded_point(&EncodedPoint::from_affine_coordinates(
            &x_coord.to_bytes(),
            &y_coord.to_bytes(),
            false, // compress
        ))
        .into_option()
        .ok_or(JsError::new(
            "Failed to create AffinePoint from coordinates",
        ))?;

        K256VerifyingKey::from_affine(point)
            .map_err(map_js_error!("Failed to create VerifyingKey: {}"))
    }
}

impl TryFrom<&K256VerifyingKey> for PublicSigningKey {
    type Error = JsError;

    fn try_from(value: &K256VerifyingKey) -> Result<Self, JsError> {
        // Parse the coordinates of the affine representation of the key
        let encoded_key = value.as_affine().to_encoded_point(false /* compress */);
        let x_coord = K256FieldElement::from_bytes(
            encoded_key
                .x()
                .ok_or(JsError::new("Failed to get x coordinate"))?,
        )
        .into_option()
        .ok_or(JsError::new(
            "Failed to create K256FieldElement from x coordinate",
        ))?;

        let y_coord = K256FieldElement::from_bytes(
            encoded_key
                .y()
                .ok_or(JsError::new("Failed to get y coordinate"))?,
        )
        .into_option()
        .ok_or(JsError::new(
            "Failed to create K256FieldElement from y coordinate",
        ))?;

        // Convert to circuit-native types
        let x = NonNativeScalar::try_from(&x_coord)?;
        let y = NonNativeScalar::try_from(&y_coord)?;

        Ok(Self { x, y })
    }
}

/// A type alias for readability
pub type SecretSigningKey = NonNativeScalar<K256_FELT_WORDS>;

impl TryFrom<&SecretSigningKey> for K256SigningKey {
    type Error = JsError;

    fn try_from(value: &SecretSigningKey) -> Result<Self, Self::Error> {
        let scalar = BigUint::from(value);
        K256SigningKey::from_slice(&scalar.to_bytes_be())
            .map_err(map_js_error!("error deserializing signing key: {}"))
    }
}

impl TryFrom<&K256SigningKey> for SecretSigningKey {
    type Error = JsError;

    fn try_from(value: &K256SigningKey) -> Result<Self, Self::Error> {
        let bigint = BigUint::from_bytes_be(&value.to_bytes());
        NonNativeScalar::try_from(&bigint)
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct PublicKeyChain {
    /// The public root key
    pub pk_root: PublicSigningKey,
    /// The public match key
    pub pk_match: PublicIdentificationKey,
    /// A nonce set by the wallet owner
    ///
    /// The owner may use this nonce to track the number of rotations of the
    /// keychain. We only allow this nonce to change when authorized by the
    /// end-user
    pub nonce: Scalar,
}

impl PublicKeyChain {
    /// Create a new public keychain with nonce zero
    pub fn new(pk_root: PublicSigningKey, pk_match: PublicIdentificationKey) -> Self {
        Self {
            pk_root,
            pk_match,
            nonce: Scalar::zero(),
        }
    }

    pub fn to_scalars(&self) -> Vec<Scalar> {
        vec![
            self.pk_root.x.scalar_words[0],
            self.pk_root.x.scalar_words[1],
            self.pk_root.y.scalar_words[0],
            self.pk_root.y.scalar_words[1],
            self.pk_match.key,
            self.nonce,
        ]
    }
}

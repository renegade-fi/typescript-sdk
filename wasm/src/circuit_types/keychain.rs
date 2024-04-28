use itertools::Itertools;
use k256::{
    ecdsa::{SigningKey as K256SigningKey, VerifyingKey as K256VerifyingKey},
    elliptic_curve::sec1::{FromEncodedPoint, ToEncodedPoint},
    AffinePoint, EncodedPoint, FieldElement as K256FieldElement,
};
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};
use std::iter;

use crate::{
    helpers::compute_poseidon_hash,
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
    fn split_biguint_into_words(mut val: BigUint) -> [Scalar; SCALAR_WORDS] {
        let scalar_mod = get_scalar_field_modulus();
        let mut res = Vec::with_capacity(SCALAR_WORDS);
        for _ in 0..SCALAR_WORDS {
            let word = Scalar::from(&val % &scalar_mod);
            val /= &scalar_mod;
            res.push(word);
        }

        res.try_into().unwrap()
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

impl<const SCALAR_WORDS: usize> From<&BigUint> for NonNativeScalar<SCALAR_WORDS> {
    fn from(val: &BigUint) -> Self {
        Self {
            scalar_words: Self::split_biguint_into_words(val.clone()),
        }
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
        Ok(Self::from(&val))
    }
}

impl From<&NonNativeScalar<K256_FELT_WORDS>> for K256FieldElement {
    fn from(value: &NonNativeScalar<K256_FELT_WORDS>) -> Self {
        let val_bigint = BigUint::from(value);
        let mut bytes = val_bigint
            .to_bytes_le()
            .into_iter()
            .chain(iter::repeat(0))
            .take(K256_FELT_BYTES)
            .collect_vec();
        bytes.reverse();

        let bytes_arr: [u8; K256_FELT_BYTES] = bytes.try_into().unwrap();

        K256FieldElement::from_bytes(&bytes_arr.into()).unwrap()
    }
}

impl From<&K256FieldElement> for NonNativeScalar<K256_FELT_WORDS> {
    fn from(value: &K256FieldElement) -> Self {
        let bytes = value.to_bytes();
        let val_bigint = BigUint::from_bytes_be(&bytes);

        Self::from(&val_bigint)
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
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, String> {
        // Parse the encoded K256 point assumed to be compressed
        let point = EncodedPoint::from_bytes(bytes).map_err(|e| e.to_string())?;

        // Convert to circuit-native types, it is simpler to go through the whole
        // conversion than decompressing manually
        let verifying_key =
            K256VerifyingKey::from_encoded_point(&point).map_err(|e| e.to_string())?;
        Ok((&verifying_key).into())
    }

    /// Convert the key to bytes
    pub fn to_uncompressed_bytes(&self) -> Vec<u8> {
        let verifying_key = K256VerifyingKey::from(self);
        verifying_key
            .to_encoded_point(false /* compress */)
            .as_bytes()
            .to_vec()
    }
}

impl From<&PublicSigningKey> for K256VerifyingKey {
    fn from(value: &PublicSigningKey) -> Self {
        // Construct a point from the raw coordinates
        let x_coord = K256FieldElement::from(&value.x);
        let y_coord = K256FieldElement::from(&value.y);

        // `k256` does not expose direct access to coordinates except through a
        // compressed form
        let point = AffinePoint::from_encoded_point(&EncodedPoint::from_affine_coordinates(
            &x_coord.to_bytes(),
            &y_coord.to_bytes(),
            false, // compress
        ))
        .unwrap();

        K256VerifyingKey::from_affine(point).unwrap()
    }
}

impl From<&K256VerifyingKey> for PublicSigningKey {
    fn from(value: &K256VerifyingKey) -> Self {
        // Parse the coordinates of the affine representation of the key
        let encoded_key = value.as_affine().to_encoded_point(false /* compress */);
        let x_coord = K256FieldElement::from_bytes(encoded_key.x().unwrap()).unwrap();
        let y_coord = K256FieldElement::from_bytes(encoded_key.y().unwrap()).unwrap();

        // Convert to circuit-native types
        let x = NonNativeScalar::from(&x_coord);
        let y = NonNativeScalar::from(&y_coord);

        Self { x, y }
    }
}

/// A type alias for readability
pub type SecretSigningKey = NonNativeScalar<K256_FELT_WORDS>;

impl TryFrom<&SecretSigningKey> for K256SigningKey {
    type Error = String;

    fn try_from(value: &SecretSigningKey) -> Result<Self, Self::Error> {
        let scalar = BigUint::from(value);
        K256SigningKey::from_slice(&scalar.to_bytes_be())
            .map_err(|e| format!("error deserializing signing key: {e}"))
    }
}

impl From<&K256SigningKey> for SecretSigningKey {
    fn from(value: &K256SigningKey) -> Self {
        let bigint = BigUint::from_bytes_be(&value.to_bytes());
        NonNativeScalar::from(&bigint)
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct PublicKeyChain {
    /// The public root key
    pub pk_root: PublicSigningKey,
    /// The public match key
    pub pk_match: PublicIdentificationKey,
}

impl PublicKeyChain {
    pub fn to_scalars(&self) -> Vec<Scalar> {
        vec![
            self.pk_root.x.scalar_words[0],
            self.pk_root.x.scalar_words[1],
            self.pk_root.y.scalar_words[0],
            self.pk_root.y.scalar_words[1],
            self.pk_match.key,
        ]
    }
}

use ark_bn254::Fr;
use ark_ff::PrimeField;
use num_bigint::{BigInt, BigUint, Sign};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::ops::{Add, AddAssign, Mul, Neg, Sub};
use wasm_bindgen::JsError;

use crate::map_js_error;

pub type ScalarField = Fr;

pub const fn n_bytes_field() -> usize {
    // We add 7 and divide by 8 to emulate a ceiling operation considering that usize
    // division is a floor
    let n_bits = ScalarField::MODULUS_BIT_SIZE as usize;
    (n_bits + 7) / 8
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Scalar(ScalarField);

impl Scalar {
    /// Returns the zero element of the scalar field.
    pub fn zero() -> Self {
        Scalar(ScalarField::from(0u8))
    }

    /// Returns the one element of the scalar field.
    pub fn one() -> Self {
        Scalar(ScalarField::from(1u8))
    }

    /// Construct a scalar from an inner field element
    pub fn new(inner: ScalarField) -> Self {
        Scalar(inner)
    }

    /// Get the inner value of the scalar
    pub fn inner(&self) -> ScalarField {
        self.0
    }

    /// Convert to big endian bytes
    ///
    /// Pad to the maximum amount of bytes needed so that the resulting bytes
    /// are of predictable length
    pub fn to_bytes_be(&self) -> Vec<u8> {
        let val_biguint = self.to_biguint();
        let mut bytes = val_biguint.to_bytes_be();

        let n_bytes = n_bytes_field();
        let mut padding = vec![0u8; n_bytes - bytes.len()];
        padding.append(&mut bytes);

        padding
    }

    /// Converts the Scalar back into a BigUint
    pub fn to_biguint(&self) -> BigUint {
        ScalarField::from(self.0).into()
    }
}

// Implement Serialize and Deserialize manually
impl Serialize for Scalar {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // Convert Scalar to BigUint, then to String for JSON compatibility
        let big_uint = self.to_biguint();
        let big_uint_str = big_uint.to_string();
        serializer.serialize_str(&big_uint_str)
    }
}

impl<'de> Deserialize<'de> for Scalar {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        // Deserialize a string and convert it to BigUint, then to Scalar
        let s = String::deserialize(deserializer)?;
        let big_uint = BigUint::parse_bytes(s.as_bytes(), 10)
            .ok_or_else(|| serde::de::Error::custom("Failed to parse BigUint"))?;
        Ok(Scalar::from(big_uint))
    }
}

impl Default for Scalar {
    fn default() -> Self {
        Self::zero()
    }
}

impl From<BigUint> for Scalar {
    fn from(val: BigUint) -> Self {
        Scalar(ScalarField::from(val.clone()))
    }
}

impl From<u64> for Scalar {
    fn from(val: u64) -> Self {
        Scalar(ScalarField::from(val))
    }
}

impl From<u128> for Scalar {
    fn from(val: u128) -> Self {
        Scalar(ScalarField::from(val))
    }
}

impl Add for Scalar {
    type Output = Self;

    fn add(self, other: Self) -> Self::Output {
        Scalar(self.0 + other.0)
    }
}

impl AddAssign for Scalar {
    fn add_assign(&mut self, other: Self) {
        self.0 += other.0;
    }
}

impl Sub for Scalar {
    type Output = Self;

    fn sub(self, other: Self) -> Self::Output {
        Scalar(self.0 - other.0)
    }
}

impl Neg for Scalar {
    type Output = Self;

    fn neg(self) -> Self::Output {
        Scalar(-self.0)
    }
}

impl Mul for Scalar {
    type Output = Self;

    fn mul(self, other: Self) -> Self::Output {
        Scalar(self.0 * other.0)
    }
}

/// Return the modulus `r` of the `Scalar` ($Z_r$) field as a `BigUint`
pub fn get_scalar_field_modulus() -> BigUint {
    ScalarField::MODULUS.into()
}

// ---------------------------
// | Conversions From Scalar |
// ---------------------------

/// Convert a scalar to a BigUint
pub fn scalar_to_biguint(a: &Scalar) -> BigUint {
    a.to_biguint()
}

/// Reduces the scalar to a u64, truncating anything above 2^64 - 1
pub fn scalar_to_u64(a: &Scalar) -> Result<u64, JsError> {
    let bytes = a.to_bytes_be();
    let len = bytes.len();

    // Take the last 8 bytes (64 bits)
    let bytes: [u8; 8] = bytes[len - 8..len]
        .try_into()
        .map_err(map_js_error!("Failed to convert bytes to u64: {}"))?;
    Ok(u64::from_be_bytes(bytes))
}

// ----------------------------
// | Conversions from Bigints |
// ----------------------------

/// Convert a bigint to a scalar
pub fn bigint_to_scalar(a: &BigInt) -> Result<Scalar, JsError> {
    match a.sign() {
        Sign::Minus => {
            let biguint = a
                .neg()
                .to_biguint()
                .ok_or(JsError::new("Failed to convert negative BigInt to BigUint"))?;
            Ok(-Scalar::from(biguint))
        }
        _ => {
            let biguint = a
                .to_biguint()
                .ok_or(JsError::new("Failed to convert BigInt to BigUint"))?;
            Ok(Scalar::from(biguint))
        }
    }
}

/// Convert a BigUint to a scalar
pub fn biguint_to_scalar(a: &BigUint) -> Scalar {
    Scalar::from(a.clone())
}

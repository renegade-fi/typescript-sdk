use ark_bn254::Fr;
use ark_ff::PrimeField;
use num_bigint::BigUint;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::ops::{Add, Mul, Sub};

pub type ScalarField = Fr;

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Scalar(ScalarField);

impl Scalar {
    /// Returns the zero element of the scalar field.
    pub fn zero() -> Self {
        Scalar(ScalarField::from(0u8))
    }

    /// Construct a scalar from an inner field element
    pub fn new(inner: ScalarField) -> Self {
        Scalar(inner)
    }

    /// Get the inner value of the scalar
    pub fn inner(&self) -> ScalarField {
        self.0
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

impl Sub for Scalar {
    type Output = Self;

    fn sub(self, other: Self) -> Self::Output {
        Scalar(self.0 - other.0)
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

/// Convert a scalar to a BigUint
pub fn scalar_to_biguint(a: &Scalar) -> BigUint {
    a.to_biguint()
}

/// Convert a BigUint to a scalar
pub fn biguint_to_scalar(a: &BigUint) -> Scalar {
    Scalar::from(a.clone())
}

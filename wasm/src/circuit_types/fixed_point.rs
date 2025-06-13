use crate::types::bigint_to_scalar;
use crate::types::{biguint_to_scalar, Scalar, ScalarField};
use bigdecimal::{BigDecimal, FromPrimitive, Num};
use lazy_static::lazy_static;
use num_bigint::BigUint;
use num_bigint::ToBigInt;
use serde::{Deserialize, Serialize};
use wasm_bindgen::JsError;

/// The default fixed point decimal precision in bits
/// i.e. the number of bits allocated to a fixed point's decimal
pub const DEFAULT_FP_PRECISION: usize = 63;

lazy_static! {
    /// The shift used to generate a scalar representation from a fixed point
    pub static ref TWO_TO_M: BigUint = BigUint::from(1u8) << DEFAULT_FP_PRECISION;

    /// The shift, converted to a scalar
    pub static ref TWO_TO_M_SCALAR: ScalarField = biguint_to_scalar(&TWO_TO_M).inner();
}

/// Represents a fixed point number not yet allocated in the constraint system
///
/// This is useful for centralizing conversion logic to provide an abstract
/// to_scalar, from_scalar interface to modules that commit to this value
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub struct FixedPoint {
    /// The underlying scalar representing the fixed point variable
    pub repr: Scalar,
}

/// Serialize and deserialize a fixed-point as an f64
impl Serialize for FixedPoint {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let repr_bigint = self.repr.to_biguint();
        repr_bigint
            .to_str_radix(10 /* radix */)
            .serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for FixedPoint {
    fn deserialize<D>(deserializer: D) -> Result<FixedPoint, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let decimal_string = String::deserialize(deserializer)?;
        let repr_bigint = BigUint::from_str_radix(&decimal_string, 10 /* radix */)
            .map_err(|e| serde::de::Error::custom(e.to_string()))?;

        Ok(Self {
            repr: Scalar::from(repr_bigint),
        })
    }
}

impl FixedPoint {
    /// Construct a fixed point value from its `Scalar` representation
    pub fn from_repr(repr: Scalar) -> Self {
        Self { repr }
    }

    /// Create a new fixed point representation of the given u64
    pub fn from_integer(val: u64) -> Self {
        let val_shifted = Scalar::from(val) * Scalar::new(*TWO_TO_M_SCALAR);
        Self { repr: val_shifted }
    }

    /// Create a new fixed point representation, rounding up to the nearest
    /// representable float
    pub fn from_f64_round_down(val: f64) -> Result<Self, JsError> {
        // Convert to a bigdecimal to shift
        let val_big_dec =
            BigDecimal::from_f64(val).ok_or(JsError::new("Failed to convert f64 to BigDecimal"))?;
        let shifted_val_big_dec =
            val_big_dec * BigDecimal::from(2u64.pow(DEFAULT_FP_PRECISION as u32));

        // Convert to a big integer
        let val_bigint = shifted_val_big_dec
            .to_bigint()
            .ok_or(JsError::new("Failed to convert BigDecimal to BigInt"))?;

        Ok(Self {
            repr: bigint_to_scalar(&val_bigint)?,
        })
    }
}

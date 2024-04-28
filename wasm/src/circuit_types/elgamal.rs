use crate::types::Scalar;
use ark_ec::{
    twisted_edwards::{Projective, TECurveConfig},
    CurveGroup,
};
use serde::{Deserialize, Serialize};

// ---------------------
// | ElGamal Key Types |
// ---------------------

/// The config of the embedded curve
pub type EmbeddedCurveConfig = ark_ed_on_bn254::EdwardsConfig;

/// The affine form of the embedded curve group
pub type EmbeddedCurveGroupAffine = ark_ed_on_bn254::EdwardsAffine;

/// A type alias representing an encryption key in the ElGamal over BabyJubJub
/// cryptosystem
pub type EncryptionKey = BabyJubJubPoint;

/// The affine representation of a point on the BabyJubJub curve
#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct BabyJubJubPoint {
    /// The x coordinate of the point
    pub x: Scalar,
    /// The y coordinate of the point
    pub y: Scalar,
}

impl Default for BabyJubJubPoint {
    fn default() -> Self {
        // The group generator
        let gen = EmbeddedCurveConfig::GENERATOR;
        let x = Scalar::new(gen.x);
        let y = Scalar::new(gen.y);

        BabyJubJubPoint { x, y }
    }
}

impl BabyJubJubPoint {
    pub fn to_scalars(&self) -> Vec<Scalar> {
        vec![self.x, self.y]
    }
}

impl From<Projective<EmbeddedCurveConfig>> for BabyJubJubPoint {
    fn from(value: Projective<EmbeddedCurveConfig>) -> Self {
        let affine = value.into_affine();
        BabyJubJubPoint {
            x: Scalar::new(affine.x),
            y: Scalar::new(affine.y),
        }
    }
}

impl From<BabyJubJubPoint> for Projective<EmbeddedCurveConfig> {
    fn from(value: BabyJubJubPoint) -> Self {
        let x = value.x.inner();
        let y = value.y.inner();

        Projective::from(EmbeddedCurveGroupAffine::new(x, y))
    }
}

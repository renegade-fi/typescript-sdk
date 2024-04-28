//! Types & trait implementations to enable deriving serde::{Serialize, Deserialize}
//! on the foreign Arkworks, Alloy, and other types that we compose into complex structs.

use crate::types::ScalarField;
use alloy_primitives::{Address, FixedBytes, Uint};
use ark_bn254::FrConfig;
use ark_ff::{BigInt, Fp, FpConfig, MontBackend};
use core::marker::PhantomData;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DeserializeAs, SerializeAs};

/// This macro implements the `SerializeAs` and `DeserializeAs` traits for a given type,
/// allowing it to be serialized / deserialized as the remote type it mirrors.
macro_rules! impl_serde_as {
    ($remote_type:ty, $def_type:ty, $($generics:tt)*) => {
        impl<$($generics)*> SerializeAs<$remote_type> for $def_type {
            fn serialize_as<S>(source: &$remote_type, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: serde::Serializer,
            {
                <$def_type>::serialize(source, serializer)
            }
        }

        impl<'de, $($generics)*> DeserializeAs<'de, $remote_type> for $def_type {
            fn deserialize_as<D>(deserializer: D) -> Result<$remote_type, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                <$def_type>::deserialize(deserializer)
            }
        }
    };
}

/// A serde-compatible type mirroring [`BigInt`]
#[serde_as]
#[derive(Serialize, Deserialize)]
#[serde(remote = "BigInt")]
pub struct BigIntDef<const N: usize>(#[serde_as(as = "[_; N]")] pub [u64; N]);

impl_serde_as!(BigInt<N>, BigIntDef<N>, const N: usize);

/// A serde-compatible type mirroring [`Fp`]
#[serde_as]
#[derive(Serialize, Deserialize)]
#[serde(remote = "Fp")]
pub struct FpDef<P: FpConfig<N>, const N: usize>(
    #[serde_as(as = "BigIntDef<N>")] pub BigInt<N>,
    pub PhantomData<P>,
);

impl_serde_as!(Fp<P, N>, FpDef<P, N>, P: FpConfig<N>, const N: usize);

/// A serde-compatible type alias mirroring [`ScalarField`]
pub type ScalarFieldDef = FpDef<MontBackend<FrConfig, 4>, 4>;

/// A serde-compatible wrapper type around [`ScalarField`],
/// allowing direct access to the underlying type
#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct SerdeScalarField(#[serde_as(as = "ScalarFieldDef")] pub ScalarField);

/// A serde-compatible type mirroring [`FixedBytes`]
#[serde_as]
#[derive(Serialize, Deserialize)]
#[serde(remote = "FixedBytes")]
pub(crate) struct FixedBytesDef<const N: usize>(#[serde_as(as = "[_; N]")] pub [u8; N]);

impl_serde_as!(FixedBytes<N>, FixedBytesDef<N>, const N: usize);

/// A serde-compatible type mirroring [`Address`]
#[serde_as]
#[derive(Serialize, Deserialize)]
#[serde(remote = "Address")]
pub(crate) struct AddressDef(#[serde_as(as = "FixedBytesDef<20>")] FixedBytes<20>);

impl_serde_as!(Address, AddressDef,);

/// A serde-compatible type mirroring [`Uint`]
#[serde_as]
#[derive(Serialize, Deserialize)]
#[serde(remote = "Uint")]
pub(crate) struct UintDef<const BITS: usize, const LIMBS: usize> {
    #[doc(hidden)]
    #[serde_as(as = "[_; LIMBS]")]
    #[serde(getter = "Uint::as_limbs")]
    limbs: [u64; LIMBS],
}

impl<const BITS: usize, const LIMBS: usize> From<UintDef<BITS, LIMBS>> for Uint<BITS, LIMBS> {
    fn from(value: UintDef<BITS, LIMBS>) -> Self {
        Uint::from_limbs(value.limbs)
    }
}

impl_serde_as!(Uint<BITS, LIMBS>, UintDef<BITS, LIMBS>, const BITS: usize, const LIMBS: usize);

/// A serde-compatible type alias mirroring [`U256`]
pub(crate) type U256Def = UintDef<256, 4>;

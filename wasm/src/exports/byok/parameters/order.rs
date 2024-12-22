use num_bigint::BigUint;
use num_traits::ToPrimitive;
use uuid::Uuid;

use crate::{
    circuit_types::{fixed_point::FixedPoint, order::OrderSide},
    exports::error::Error,
    helpers::biguint_from_hex_string,
};

pub struct CreateOrderParameters {
    pub id: Uuid,
    pub base_mint: BigUint,
    pub quote_mint: BigUint,
    pub side: OrderSide,
    pub amount: u128,
    pub worst_case_price: FixedPoint,
    pub min_fill_size: u128,
    pub allow_external_matches: bool,
}

impl CreateOrderParameters {
    pub fn new(
        id: &str,
        base_mint: &str,
        quote_mint: &str,
        side: &str,
        amount: &str,
        worst_case_price: &str,
        min_fill_size: &str,
        allow_external_matches: bool,
    ) -> Result<Self, Error> {
        let id = if id.is_empty() {
            Uuid::new_v4()
        } else {
            Uuid::parse_str(id)
                .map_err(|e| Error::invalid_parameter(format!("Invalid UUID: {}", e)))?
        };

        let side = match side.to_lowercase().as_str() {
            "sell" => OrderSide::Sell,
            "buy" => OrderSide::Buy,
            _ => return Err(Error::invalid_parameter("Invalid order side")),
        };

        let base_mint = biguint_from_hex_string(base_mint)
            .map_err(|e| Error::invalid_parameter(format!("Invalid base mint: {}", e)))?;

        let quote_mint = biguint_from_hex_string(quote_mint)
            .map_err(|e| Error::invalid_parameter(format!("Invalid quote mint: {}", e)))?;

        let amount = biguint_from_hex_string(amount)
            .map_err(|e| Error::invalid_parameter(format!("Invalid amount: {}", e)))?
            .to_u128()
            .ok_or_else(|| Error::invalid_parameter(format!("Could not convert amount to u128")))?;

        let min_fill_size = biguint_from_hex_string(min_fill_size)
            .map_err(|e| Error::invalid_parameter(format!("Invalid min fill size: {}", e)))?
            .to_u128()
            .ok_or_else(|| {
                Error::invalid_parameter(format!("Could not convert min fill size to u128"))
            })?;

        let worst_case_price = if worst_case_price.is_empty() {
            match side {
                OrderSide::Sell => FixedPoint::from_integer(0),
                OrderSide::Buy => FixedPoint::from_integer(u64::MAX),
            }
        } else {
            worst_case_price
                .parse::<f64>()
                .map_err(|e| Error::invalid_parameter(format!("Invalid worst case price: {}", e)))
                .map(FixedPoint::from_f64_round_down)?
        };

        Ok(Self {
            id,
            base_mint,
            quote_mint,
            side,
            amount,
            worst_case_price,
            min_fill_size,
            allow_external_matches,
        })
    }
}

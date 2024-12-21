use super::error::Error;
use crate::{common::types::Wallet, external_api::types::ApiWallet};

/// Deserializes a JSON string into a [`Wallet`] type
pub fn deserialize_wallet(json_str: &str) -> Result<Wallet, Error> {
    let api_wallet: ApiWallet =
        serde_json::from_reader(json_str.as_bytes()).map_err(Error::wallet_deserialization)?;

    let internal_wallet: Result<Wallet, _> = api_wallet.try_into();
    internal_wallet.map_err(|e| Error::wallet_deserialization(e.to_string()))
}

/// Macro for serializing Rust types to JavaScript values
#[macro_export]
macro_rules! serialize_to_js {
    ($expr:expr) => {
        serde_json::to_string(&$expr)
            .map(|result| JsValue::from_str(&result))
            .map_err(|e| JsError::new(&e.to_string()))
    };
}

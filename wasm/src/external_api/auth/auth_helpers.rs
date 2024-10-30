use crate::common::keychain::HmacKey;
use base64::engine::{general_purpose as b64_general_purpose, Engine};
use hex;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// The header namespace to include in the HMAC
const RENEGADE_HEADER_NAMESPACE: &str = "x-renegade";

#[wasm_bindgen]
pub fn create_request_signature(
    path: &str,
    headers: JsValue,
    body: &str,
    key: &str,
) -> Result<String, JsError> {
    let key = HmacKey::from_hex_string(key).unwrap();
    let body_bytes = body.as_bytes();

    let headers: HashMap<String, String> = serde_wasm_bindgen::from_value(headers)
        .map_err(|e| JsError::new(&format!("Failed to deserialize headers: {}", e)))?;
    let mac = _create_request_signature(path, &headers, body_bytes, &key);
    Ok(b64_general_purpose::STANDARD_NO_PAD.encode(mac))
}

/// Create a request signature
fn _create_request_signature(
    path: &str,
    headers: &HashMap<String, String>,
    body: &[u8],
    key: &HmacKey,
) -> Vec<u8> {
    // Compute the expected HMAC
    let path_bytes = path.as_bytes();
    let header_bytes = get_header_bytes(headers);
    let payload = [path_bytes, &header_bytes, body].concat();

    key.compute_mac(&payload)
}

/// Get the header bytes to validate in an HMAC
fn get_header_bytes(headers: &HashMap<String, String>) -> Vec<u8> {
    let mut headers_buf = Vec::new();

    // Filter out non-Renegade headers and the auth header
    let mut renegade_headers: Vec<_> = headers
        .iter()
        .filter_map(|(k, v)| {
            let key = k.to_lowercase();
            if key.starts_with(RENEGADE_HEADER_NAMESPACE) && key != super::RENEGADE_AUTH_HEADER_NAME
            {
                Some((key, v))
            } else {
                None
            }
        })
        .collect();

    // Sort alphabetically, then add to the buffer
    renegade_headers.sort_by(|a, b| a.0.cmp(&b.0));
    for (key, value) in renegade_headers {
        headers_buf.extend_from_slice(key.as_bytes());
        headers_buf.extend_from_slice(value.as_bytes());
    }

    headers_buf
}

#[wasm_bindgen]
pub fn b64_to_hex_hmac_key(b64_key: &str) -> Result<String, JsError> {
    // Decode the base64 string to bytes
    let key_bytes = b64_general_purpose::STANDARD
        .decode(b64_key)
        .map_err(|e| JsError::new(&format!("Failed to decode base64 key: {}", e)))?;

    // Create an HmacKey from the decoded bytes
    let hmac_key: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| JsError::new("Invalid key length"))?;

    // Convert the HmacKey to a hex string
    Ok(hex::encode(hmac_key))
}

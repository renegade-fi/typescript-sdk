use wasm_bindgen::prelude::*;

use crate::exports::byok::parameters::GetPkRootParameters;

#[wasm_bindgen]
pub fn byok_get_pk_root_scalars(pk_root: &str) -> Result<Vec<JsValue>, JsError> {
    let params = GetPkRootParameters::new(pk_root)?;
    let scalars = vec![
        params.pk_root.x.scalar_words[0],
        params.pk_root.x.scalar_words[1],
        params.pk_root.y.scalar_words[0],
        params.pk_root.y.scalar_words[1],
    ]
    .iter()
    .map(|scalar| JsValue::from_str(&scalar.to_biguint().to_string()))
    .collect();
    Ok(scalars)
}

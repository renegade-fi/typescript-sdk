use uuid::Uuid;

use crate::exports::error::Error;

pub struct CancelOrderParameters {
    pub id: Uuid,
}

impl CancelOrderParameters {
    pub fn new(id: &str) -> Result<Self, Error> {
        let id = Uuid::parse_str(id)
            .map_err(|e| Error::invalid_parameter(format!("Invalid order ID: {}", e)))?;

        Ok(Self { id })
    }
}

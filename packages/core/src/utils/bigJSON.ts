import JSONBigInt from "json-bigint";

const jsonProcessor = JSONBigInt({
    alwaysParseAsBig: true,
    useNativeBigInt: true,
});

// Helper to parse bigint values from a JSON string
export const parseBigJSON = (data: string) => {
    return jsonProcessor.parse(data);
};

// Helper to stringify bigint values to a JSON string for use with WASM utilities
export const stringifyForWasm = (data: any) => {
    return JSONBigInt.stringify(data);
};

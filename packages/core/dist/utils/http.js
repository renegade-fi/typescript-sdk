import axios from 'axios';
import JSONBigint from 'json-bigint';
import { getSkRoot } from '../index.js';
import { RENEGADE_AUTH_HEADER_NAME, RENEGADE_SIG_EXPIRATION_HEADER_NAME, } from '../constants.js';
export async function postRelayerRaw(url, body, headers = {}) {
    try {
        const response = await axios.post(url, body, { headers });
        // console.log(`POST ${url} with body: `, body, "response: ", response.data)
        // Process the response data as needed
        return response.data; // Assuming the function should return the response data
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response error:', error.response.data);
            }
            else if (error.request) {
                // The request was made but no response was received
                console.error('Request error: No response received');
            }
            else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error:', error.message);
            }
        }
        else {
            // Non-Axios error
            console.error('Error:', error);
        }
        throw error; // Rethrow the error for further handling or logging
    }
}
export async function getRelayerRaw(url, headers = {}) {
    try {
        const response = await axios.get(url, {
            headers,
            transformResponse: (data) => {
                try {
                    return JSONBigint({ useNativeBigInt: true }).parse(data);
                }
                catch (_error) {
                    return data;
                }
            },
        });
        // console.log(`GET ${url} response: `, response.data)
        // Process the response data as needed
        return response.data; // Assuming the function should return the response data
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response error:', error.response.data);
            }
            else if (error.request) {
                // The request was made but no response was received
                console.error('Request error: No response received');
            }
            else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error:', error.message);
            }
        }
        else {
            // Non-Axios error
            console.error('Error:', error);
        }
        throw error; // Rethrow the error for further handling or logging
    }
}
export async function postRelayerWithAuth(config, url, body) {
    const skRoot = await getSkRoot(config);
    const [auth, expiration] = config.utils.build_auth_headers(skRoot, body ?? '', BigInt(Date.now()));
    const headers = {
        [RENEGADE_AUTH_HEADER_NAME]: auth,
        [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
        'Content-Type': 'application/json',
    };
    return await postRelayerRaw(url, body, headers);
}
export async function getRelayerWithAuth(config, url) {
    const skRoot = await getSkRoot(config);
    const [auth, expiration] = config.utils.build_auth_headers(skRoot, '', BigInt(Date.now()));
    const headers = {
        [RENEGADE_AUTH_HEADER_NAME]: auth,
        [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
        'Content-Type': 'application/json',
    };
    return await getRelayerRaw(url, headers);
}
//# sourceMappingURL=http.js.map
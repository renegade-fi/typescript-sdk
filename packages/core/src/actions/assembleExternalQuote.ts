import invariant from "tiny-invariant";
import { ASSEMBLE_EXTERNAL_MATCH_ROUTE, RENEGADE_API_KEY_HEADER } from "../constants.js";
import type { AuthConfig } from "../createAuthConfig.js";
import { BaseError, type BaseErrorType } from "../errors/base.js";
import type {
    ExternalOrder,
    SponsoredMatchResponse,
    SponsoredQuoteResponse,
} from "../types/externalMatch.js";
import { stringifyForWasm } from "../utils/bigJSON.js";
import { postWithSymmetricKey } from "../utils/http.js";

export type AssembleExternalQuoteParameters = {
    quote: SponsoredQuoteResponse;
    updatedOrder?: ExternalOrder;
    doGasEstimation?: boolean;
    receiverAddress?: `0x${string}`;
    requestGasSponsorship?: boolean;
    refundAddress?: `0x${string}`;
};

export type AssembleExternalQuoteReturnType = SponsoredMatchResponse;

export type AssembleExternalQuoteErrorType = BaseErrorType;

export async function assembleExternalQuote(
    config: AuthConfig,
    parameters: AssembleExternalQuoteParameters,
): Promise<AssembleExternalQuoteReturnType> {
    const {
        quote,
        updatedOrder,
        doGasEstimation = false,
        receiverAddress = "",
        requestGasSponsorship,
        refundAddress,
    } = parameters;

    if (requestGasSponsorship !== undefined || refundAddress !== undefined) {
        console.warn(
            "`requestGasSponsorship` and `refundAddress` are deprecated. Request gas sponsorship when requesting the quote.",
        );
    }

    const { apiSecret, apiKey } = config;
    invariant(apiSecret, "API secret not specified in config");
    invariant(apiKey, "API key not specified in config");
    const symmetricKey = config.utils.b64_to_hex_hmac_key(apiSecret);

    const stringifiedQuote = stringifyForWasm(quote);
    const stringifiedOrder = updatedOrder ? stringifyForWasm(updatedOrder) : "";
    const body = config.utils.assemble_external_match(
        doGasEstimation,
        stringifiedOrder,
        stringifiedQuote,
        receiverAddress,
    );

    const url = config.getBaseUrl(ASSEMBLE_EXTERNAL_MATCH_ROUTE);

    const res = await postWithSymmetricKey(config, {
        url,
        body,
        key: symmetricKey,
        headers: {
            [RENEGADE_API_KEY_HEADER]: apiKey,
        },
    });
    if (!res.match_bundle) {
        throw new BaseError("Failed to assemble external quote");
    }
    return res;
}

import type { Config } from "../createConfig.js";
import type { BaseErrorType } from "../errors/base.js";
import { createWallet } from "./createWallet.js";
import { getWalletFromRelayer } from "./getWalletFromRelayer.js";
import { getWalletId } from "./getWalletId.js";
import { checkForWalletUpdatesOnChain, lookupWallet } from "./lookupWallet.js";

export type ConnectParameters = {
    isCreateWallet?: boolean;
};

export type ConnectReturnType = {
    isLookup: boolean;
    job: Promise<void>;
} | void;

export type ConnectErrorType = BaseErrorType;

export async function connect(
    config: Config,
    params: ConnectParameters = {},
): Promise<ConnectReturnType> {
    const logger = config.getLogger("core:actions:connect");
    try {
        const { isCreateWallet = false } = params;
        const walletId = getWalletId(config);
        config.setState((x) => ({ ...x, id: walletId }));

        logger.debug("Attempting to connect wallet", { walletId: config.state.id });

        try {
            const wallet = await getWalletFromRelayer(config);
            if (wallet) {
                config.setState((x) => ({ ...x, status: "in relayer" }));
                logger.debug("Wallet found in relayer", { walletId: config.state.id });
                return;
            }
        } catch (error) {
            logger.error(
                `Wallet not found in relayer: ${error instanceof Error ? error.message : String(error)}`,
                { walletId: config.state.id },
            );
        }

        // Create wallet iff no WalletUpdated events found onchain
        const shouldCreateWallet = await checkForWalletUpdatesOnChain(config);
        if (shouldCreateWallet || isCreateWallet) {
            return Promise.resolve({
                isLookup: false,
                job: createWallet(config),
            });
        }
        return Promise.resolve({
            isLookup: true,
            job: lookupWallet(config),
        });
    } catch (error) {
        logger.error(
            `Could not connect wallet: ${error instanceof Error ? error.message : String(error)}`,
            { walletId: config.state.id },
        );
        config.setState({});
    }
}

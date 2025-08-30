import invariant from "tiny-invariant";
import type { Config } from "../createConfig.js";
import { getWalletFromRelayer } from "./getWalletFromRelayer.js";

export async function reconnect(config: Config) {
    const logger = config.getLogger("core:actions:reconnect");
    try {
        invariant(config.state.seed, "No seed found");
        invariant(config.state.id, "No id found");
        const wallet = await getWalletFromRelayer(config);
        if (wallet) {
            config.setState((x) => ({
                ...x,
                status: "in relayer",
            }));
            logger.debug("Wallet found in relayer", { walletId: wallet.id });
        }
    } catch (error) {
        logger.error(
            `Could not reconnect: ${error instanceof Error ? error.message : String(error)}`,
            {},
        );
        config.setState({});
    }
}

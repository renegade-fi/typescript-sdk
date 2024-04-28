import invariant from "tiny-invariant";
import {} from "viem";
import {} from "../createConfig.js";
export function getSkRoot(config, parameters = {}) {
    const { seed } = parameters;
    const { utils } = config;
    if (seed) {
        config.setState({ ...config.state, seed });
        return utils.derive_signing_key_from_seed(seed);
    }
    const storedSeed = config.state.seed;
    invariant(storedSeed, "Seed must be defined when none exists in memory");
    return utils.derive_signing_key_from_seed(storedSeed);
}
//# sourceMappingURL=getSkRoot.js.map
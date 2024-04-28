import {} from "../createConfig.js";
export async function disconnect(config, parameters = {}) {
    const {} = config;
    const {} = parameters;
    config.setState({ status: "disconnected", id: undefined, seed: undefined });
}
//# sourceMappingURL=disconnect.js.map
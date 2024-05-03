export function watchStatus(config, parameters) {
    const { onChange } = parameters;
    return config.subscribe((state) => state.status, onChange);
}
//# sourceMappingURL=watchStatus.js.map
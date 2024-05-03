import { getSkRoot } from './getSkRoot.js';
export function getPkRoot(config) {
    const { utils } = config;
    const skRoot = getSkRoot(config);
    return `0x${utils.get_pk_root(skRoot)}`;
}
export function getPkRootScalars(config) {
    const { utils } = config;
    const skRoot = getSkRoot(config);
    const scalars = utils.pk_root_scalars(skRoot);
    return scalars.map((s) => BigInt(s)).slice(0, 4);
}
//# sourceMappingURL=getPkRoot.js.map
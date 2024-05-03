import type { Config } from '../createConfig.js';
export declare function postRelayerRaw(url: string, body: any, headers?: {}): Promise<any>;
export declare function getRelayerRaw(url: string, headers?: {}): Promise<any>;
export declare function postRelayerWithAuth(config: Config, url: string, body?: string): Promise<any>;
export declare function getRelayerWithAuth(config: Config, url: string): Promise<any>;
//# sourceMappingURL=http.d.ts.map
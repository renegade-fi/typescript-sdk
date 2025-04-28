import { defineConfig } from "@wagmi/cli";
import { actions } from "@wagmi/cli/plugins";
import { parseAbi } from "viem/utils";

const erc20Abi = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function mint(address _address, uint256 value) external",
]);

export default defineConfig({
    out: "src/generated.ts",
    contracts: [
        {
            name: "erc20",
            abi: erc20Abi,
        },
    ],
    plugins: [actions()],
});

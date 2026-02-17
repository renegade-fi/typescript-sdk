import type { MalleableExternalMatchResponse } from "@renegade-fi/renegade-sdk";

/**
 * Set a random input amount on the bundle and print the results
 * @param bundle The malleable match bundle
 */
export function setRandomInputAmount(bundle: MalleableExternalMatchResponse) {
    // Print bundle info
    console.log("\nBundle info:");
    const [minInput, maxInput] = bundle.inputBounds();
    const [minOutput, maxOutput] = bundle.outputBounds();
    console.log(`Input bounds: ${minInput} - ${maxInput}`);
    console.log(`Output bounds: ${minOutput} - ${maxOutput}`);

    // Pick a hypothetical input amount and see the receive amount
    const dummyInputAmount = randomInRange(minInput, maxInput);
    const dummyReceiveAmount = bundle.receiveAmountAtInput(dummyInputAmount);
    console.log(`Hypothetical input amount: ${dummyInputAmount}`);
    console.log(`Hypothetical send amount: ${dummyInputAmount}`);
    console.log(`Hypothetical receive amount: ${dummyReceiveAmount}`);

    // Pick an actual input amount to swap with
    const swappedInputAmount = randomInRange(minInput, maxInput);

    // Setting the input amount returns the receive amount at the new input
    // You can also call sendAmount() and receiveAmount() to get the amounts
    // at the currently set input amount
    bundle.setInputAmount(swappedInputAmount);
    const send = bundle.sendAmount();
    const recv = bundle.receiveAmount();
    console.log(`Swapped input amount: ${swappedInputAmount}`);
    console.log(`Send amount: ${send}`);
    console.log(`Receive amount: ${recv}`);
}

/** Generate a random value in the given range */
function randomInRange(min: bigint, max: bigint): bigint {
    return min + BigInt(Math.floor(Math.random() * (Number(max) - Number(min))));
}

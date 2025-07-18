import type { MalleableExternalMatchResponse } from "@renegade-fi/node";

/**
 * Set a random base amount on the bundle and print the results
 * @param bundle The malleable match bundle
 */
export function setRandomBaseAmount(bundle: MalleableExternalMatchResponse) {
    // Print bundle info
    console.log("Bundle info:");
    const [minBase, maxBase] = bundle.baseBounds();
    console.log(`Base bounds: ${minBase} - ${maxBase}`);

    // Pick a random base amount and see the send and receive amounts at that base amount
    const dummyBaseAmount = randomInRange(minBase, maxBase);
    const dummySendAmount = bundle.sendAmountAtBase(dummyBaseAmount);
    const dummyReceiveAmount = bundle.receiveAmountAtBase(dummyBaseAmount);
    console.log(`Hypothetical base amount: ${dummyBaseAmount}`);
    console.log(`Hypothetical send amount: ${dummySendAmount}`);
    console.log(`Hypothetical receive amount: ${dummyReceiveAmount}`);

    // Pick an actual base amount to swap with
    const swappedBaseAmount = randomInRange(minBase, maxBase);

    // Setting the base amount will return the receive amount at the new base
    // You can also call sendAmount and receiveAmount to get the amounts at the
    // currently set base amount
    bundle.setBaseAmount(swappedBaseAmount);
    const send = bundle.sendAmount();
    const recv = bundle.receiveAmount();
    console.log(`Swapped base amount: ${swappedBaseAmount}`);
    console.log(`Send amount: ${send}`);
    console.log(`Receive amount: ${recv}`);
}

/** Generate a random value in the given range */
function randomInRange(min: bigint, max: bigint): bigint {
    return min + BigInt(Math.floor(Math.random() * (Number(max) - Number(min))));
}

/**
 * Set a random quote amount on the bundle and print the results
 * @param bundle The malleable match bundle
 */
// biome-ignore lint/correctness/noUnusedVariables: User can choose to use this function in the example
function setRandomQuoteAmount(bundle: MalleableExternalMatchResponse) {
    // Print bundle info
    console.log("Bundle info:");
    const [minQuote, maxQuote] = bundle.quoteBounds();
    console.log(`Quote bounds: ${minQuote} - ${maxQuote}`);

    // Pick a random base amount and see the send and receive amounts at that base amount
    const dummyQuoteAmount = randomInRange(minQuote, maxQuote);
    const dummySendAmount = bundle.sendAmountAtQuote(dummyQuoteAmount);
    const dummyReceiveAmount = bundle.receiveAmountAtQuote(dummyQuoteAmount);
    console.log(`Hypothetical quote amount: ${dummyQuoteAmount}`);
    console.log(`Hypothetical send amount: ${dummySendAmount}`);
    console.log(`Hypothetical receive amount: ${dummyReceiveAmount}`);

    // Pick an actual base amount to swap with
    const swappedQuoteAmount = randomInRange(minQuote, maxQuote);

    // Setting the quote amount will return the receive amount at the new quote
    // You can also call sendAmount and receiveAmount to get the amounts at the
    // currently set quote amount
    bundle.setQuoteAmount(swappedQuoteAmount);
    const send = bundle.sendAmount();
    const recv = bundle.receiveAmount();
    console.log(`Swapped quote amount: ${swappedQuoteAmount}`);
    console.log(`Send amount: ${send}`);
    console.log(`Receive amount: ${recv}`);
}

import { getTaskStatus } from "./getTaskStatus.js";
import axios from "axios";
import {} from "../createConfig.js";
export async function waitForTaskCompletion(config, parameters, onStateChange) {
    const { pollingInterval } = config;
    let lastState = "";
    while (true) {
        try {
            const response = await getTaskStatus(config, { id: parameters.id });
            const taskState = response.state;
            onStateChange?.(response);
            if (taskState !== lastState) {
                // console.log(`Task ${response.description} is ${taskState}...`)
                lastState = taskState;
            }
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    // Assume a 404 means the task is completed
                    break;
                }
            }
        }
        // Sleep for a bit before polling again
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
}
//# sourceMappingURL=waitForTaskCompletion.js.map
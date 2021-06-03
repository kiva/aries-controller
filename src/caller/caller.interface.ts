export const CALLER = 'CALLER';

export interface ICaller {

    /**
     * Spins up a new agent, specific implementations handle single vs multi agent
     */
    spinUpAgent(): Promise<any>;



    /**
     * Makes an API call to an agent, specific implementations handle single vs multi agent
     */
    callAgent(method: any, route: string, params?: any, data?: any): Promise<any>;

    /**
     * Spins down an agent, specific implementations handle single vs multi agent
     */
    spinDownAgent(): Promise<any>;
}

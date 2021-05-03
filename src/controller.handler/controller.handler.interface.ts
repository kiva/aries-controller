export interface IControllerHandler {

    /**
     * Loads values needed to make agent related calls, specific implementations handle multi vs single controller
     */
    loadValues(): Promise<any>;

    /**
     * Gets the agent id based on configuration and/or request, specific implementations handle multi vs single controller
     */
    handleAgentId(): string;

    /**
     * Gets the admin api key, specific implementations handle multi vs single controller
     */
    handleAdminApiKey(agentId?: string): Promise<string>;
}

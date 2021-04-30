export interface IControllerHandler {

    loadValues(): Promise<any>;

    handleAgentId(): string;

    handleAdminApiKey(agentId?: string): Promise<string>;
}

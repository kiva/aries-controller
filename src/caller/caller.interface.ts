export interface ICaller {

    spinUpAgent(agentId: string): Promise<any>;

    callAgent(agentId: string, method: any, route: string, params?: any, data?: any): Promise<any>;
}
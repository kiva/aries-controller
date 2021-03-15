
/*
   Defines required contract for classes implementing webhook handlers
 */
export interface IAgentResponseHandler {
    handleAcapyWebhookMsg(agentUrl: string, agentId: string, adminApiKey: string,
                          route: string, topic: string, body: any, token?: string): Promise<any>;
}

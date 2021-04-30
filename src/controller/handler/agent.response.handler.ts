
/*
   Defines required contract for classes implementing webhook handlers
 */
export interface IAgentResponseHandler {
    // TODO replace agentUrl + adminApiKey + token with a ICaller object (which would contain all those things)
    // TODO remove route param since it will always be the string 'topic'
    // Note agentId is still used for caching
    handleAcapyWebhookMsg(agentUrl: string, agentId: string, adminApiKey: string,
                          route: string, topic: string, body: any, token?: string): Promise<any>;
}

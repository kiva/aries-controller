import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { BaseAgentResponseHandler } from './base.agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import { CacheStore } from '@nestjs/common';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

/*
    Acapy webhooks handler for input received from the url [webhookurl]/v1/webhook/topic/connections
*/
export class Connections extends BaseAgentResponseHandler {
    private static CONNECTIONS_URL = 'connections';
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    private async checkPolicyForAction(governanceKey: string, cacheKey: string) {
        const permissionState = this.agentGovernance.peekPermission(Connections.CONNECTIONS_URL, governanceKey);

        if (AgentGovernance.PERMISSION_DENY === permissionState) {
            throw new ProtocolException(ProtocolErrorCode.AGENCY_GOVERNANCE,`${governanceKey} governance doesnt not allow.`);
        }

        // if the cacheKey is in the cache then the agent has already accepted the request
        // when we only allow once, there is no need to continue with this message
        if (await this.cache.get<any>(cacheKey) && permissionState === AgentGovernance.PERMISSION_ONCE) {
            throw new ProtocolException(ProtocolErrorCode.AGENCY_GOVERNANCE,`${governanceKey} governance has already been used.`);
        }
    }

    /*
        body is expected to be like this
        {
            "connection_id":"6739a6e0-f560-43fb-8597-1ec246dcf737",
            "their_role":"invitee",
            "state":"invitation",
            "invitation_key":"HVRHtK4sjNn8imkQZm3bXRvgYFimgPxgLVzuMxxEdwS4",
            "routing_state":"none",
            "accept":"manual",
            "created_at":"2021-03-03 15:00:43.680821Z",
            "rfc23_state":"invitation-sent",
            "updated_at":"2021-03-03 15:00:43.680821Z",
            "invitation_mode":"once"
        }

        The key attribute is the rfc23_state which will determine the corresponding action:
        invitation-sent => do nothing
        invitation-received => accept-invitation
        request-sent => do nothing
        request-received => accept-request
        response-sent => do nothing
        completed => do nothing

        for this handler, this will always be true:
        Route will be "topic"
        topic will be "connections"
    */
    public async handleAcapyWebhookMsg(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {
        const readPermission = async (governanceKey: string, cacheKey: string) => {
            this.agentGovernance.readPermission('connections', governanceKey);
            await this.cache.set(cacheKey, {});
        };

        if (route !== 'topic' || topic !== 'connections') {
            throw new ProtocolException(ProtocolErrorCode.AGENCY_GOVERNANCE,`${route}/${topic} is not valid.`);
        }

        // allow consumers to process credentials prior to and differently than provided by this handler.  If the callback
        // returns true (explicitly), it means this handlers code should not be executed.
        if (true === await this.agentGovernance.invokeHandler(agentUrl, agentId, adminApiKey, route, topic, body, token))
            return;

        const templatedCacheKey = `${agentId}-${body.state as string}-${body.initiator as string}`;

        // this webhook message indicates an agent received an connection
        // invitation and we want to tell them to accept it, if the policy allows
        if (body.rfc23_state === 'invitation-received') {
            const action = 'accept-invitation';
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            const url: string = agentUrl + `/${Connections.CONNECTIONS_URL}/${body.connection_id as string}/${action}`;
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);

            Logger.info(`requesting agent to accept connection invite ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        // this webhook message indicates the receiving agent has accepted the invite and now
        // we need to instruct this agent to finish the steps of a connection
        if (body.rfc23_state === 'request-received') {
            const action = 'accept-request';
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            const url: string = agentUrl + `/${Connections.CONNECTIONS_URL}/${body.connection_id as string}/${action}`;
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);

            Logger.info(`requesting initiating agent to complete connection invite ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }


        Logger.debug(`doing nothing for '${agentId}': route '${route}'; topic '${topic}'; rfc23_state '${body.rfc23_state as string}';`, body);
        return;
    }
}

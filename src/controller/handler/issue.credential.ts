import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { BaseAgentResponseHandler } from './base.agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import { CacheStore } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';


/*
    Acapy webhooks handler for input received from the url [webhookurl]/v1/webhook/topic/connections
 */
export class IssueCredential extends BaseAgentResponseHandler {
    private static ISSUE_CREDENTIALS_URL = 'issue-credential';
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    private async checkPolicyForAction(governanceKey: string, cacheKey: string) {
        const permissionState = this.agentGovernance.peekPermission(IssueCredential.ISSUE_CREDENTIALS_URL, governanceKey);
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
           "credential_proposal_dict":{
           },
           "role":"holder",
           "initiator":"external",
           "thread_id":"ae318258-efbd-4928-ba19-16c4493af8c9",
           "credential_offer":{
           },
           "auto_issue":false,
           "trace":false,
           "connection_id":"a4ec2a76-9bc8-41af-857d-e7117fcb82d5",
           "updated_at":"2020-08-20 18:54:26.424447Z",
           "credential_definition_id":"Th7MpTaRZVRYnPiabds81Y:3:CL:12:issued_1",
           "state":"offer_received",
           "auto_offer":false,
           "auto_remove":true,
           "credential_exchange_id":"5a662281-7828-4085-9de8-06b6210c36b7",
           "created_at":"2020-08-20 18:54:26.424447Z",
           "schema_id":"Th7MpTaRZVRYnPiabds81Y:2:sample_schema:1.0"
        }

        for this handler, this will always be true:
        Route will be "topic"
        topic will be "issue_credential"

        State transitions:
        issuer offer_sent
        holder offer_received
          action -> send-request
        holder request_sent
        issuer request_received
          action -> issue
        issuer credential_issued
        holder credential_received
          action -> store
        holder credential_acked
        issuer credential_acked
    */
    public async handleAcapyWebhookMsg(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: Body, token?: string
    ): Promise<any> {
        if (route !== 'topic' || topic !== 'issue_credential') {
            throw new ProtocolException(ProtocolErrorCode.AGENCY_GOVERNANCE,`${route}/${topic} is not valid.`);
        }

        // allow consumers to process credentials prior to and differently than provided by this handler.  If the callback
        // returns true (explicitly), it means this handlers code should not be executed.
        if (true === await this.agentGovernance.invokeHandler(agentUrl, agentId, adminApiKey, route, topic, body, token))
            return;

        const readPermission = async (governanceKey: string, cacheKey: string) => {
            this.agentGovernance.readPermission(IssueCredential.ISSUE_CREDENTIALS_URL, governanceKey);
            await this.cache.set(cacheKey, {});
        };

        if (body.role === 'holder' && body.state === 'offer_received') {
            const action = 'send-request';
            const templatedCacheKey = `${agentId}-${body.role}-${body.credential_exchange_id}`;
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);
            const url: string = agentUrl + `/${IssueCredential.ISSUE_CREDENTIALS_URL}/records/${body.credential_exchange_id}/${action}`;
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);
            Logger.info(`requesting holder to send-request ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        // Not sure why, but sometimes the role for issuer comes back as undefined
        if ((body.role === 'issuer' || body.role === undefined) && body.state === 'request_received') {
            if (body.auto_issue === true) {
                Logger.info('Not requesting issuer to issue credential, because auto_issue is true');
                return;
            }
            const action = 'issue';
            const templatedCacheKey = `${agentId}-${body.role}-${body.credential_exchange_id}`;
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            const url: string = agentUrl + `/${IssueCredential.ISSUE_CREDENTIALS_URL}/records/${body.credential_exchange_id}/${action}`;
            const data = {
                credential_preview: body.credential_offer_dict.credential_preview
            };
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);
            req.data = data;
            Logger.info(`requesting issuer to issue credential ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        if (body.role === 'holder' && body.state === 'credential_received') {
            const action = 'store';
            const templatedCacheKey = `${agentId}-${body.role}-${body.credential_exchange_id}`;
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            const url: string = agentUrl + `/${IssueCredential.ISSUE_CREDENTIALS_URL}/records/${body.credential_exchange_id}/${action}`;
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);
            Logger.info(`requesting holder to save credential ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        Logger.debug(`doing nothing for '${agentId}': route '${route}': topic '${topic}': role '${body.role}': state '${body.state}'`);
        return;
    }
}

interface Body {
    credential_proposal_dict: object
    role: string
    initiator: string
    thread_id: string
    credential_offer: object
    auto_issue: boolean
    trace: boolean
    connection_id: string
    updated_at: string
    credential_definition_id: string
    state: string
    auto_offer: boolean
    auto_remove: boolean
    credential_exchange_id: string
    created_at: string
    schema_id: string
    credential_offer_dict: {
        [index: string]: any
        credential_preview: any
    }
}

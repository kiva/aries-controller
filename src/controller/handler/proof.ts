import { CacheStore, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { ProtocolHttpService, ProtocolException, ProtocolErrorCode } from 'protocol-common';
import { AgentGovernance } from '../agent.governance.js';
import { BaseAgentResponseHandler } from './base.agent.response.handler.js';

export class Proofs extends BaseAgentResponseHandler {
    private static PROOFS_URL = 'present-proof';

    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    private async checkPolicyForAction(governanceKey: string, cacheKey: string) {
        const permissionState = this.agentGovernance.peekPermission(Proofs.PROOFS_URL, governanceKey);
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
        we will get an array like this:
        [
        { cred_info:
          { referent: 'd7ff6b53-c59e-4c43-8a2d-e411b1c7683c',
            attrs: { score: 750},
            schema_id: 'Th7MpTaRZVRYnPiabds81Y:2:sample_schema:1.0',
            cred_def_id: 'Th7MpTaRZVRYnPiabds81Y:3:CL:12:issued_1',
            rev_reg_id: null,
            cred_rev_id: null
          },
          interval: null,
          presentation_referents: [ 'score' ]
        }
        ]
        and create this:
         { score:
           { cred_info:
              { referent: '40ea2f38-593d-46b6-839f-540232f60c5b',
                attrs: [Object],
                schema_id: 'Th7MpTaRZVRYnPiabds81Y:2:sample_schema:1.0',
                cred_def_id: 'Th7MpTaRZVRYnPiabds81Y:3:CL:12:issued_1',
                rev_reg_id: null,
                cred_rev_id: null },
             interval: null,
             presentation_referents: [ 'score' ]
           }
         }
    */
    private async getCredentialsByReferentId(url: string, adminApiKey: string, token?: string): Promise<any> {
        const req: AxiosRequestConfig = {
            method: 'GET',
            url,
            headers: {
                'x-api-key': adminApiKey,
            }
        };
        if (token) {
            req.headers.Authorization = 'Bearer ' + token;
        }
        const res = await this.http.requestWithRetry(req);
        // We'd like to present the list of credentials with newest issued first, however issue time is not exposed
        // The closest we can come is the cred_rev_id since this is an integer that increments sequentially (but only for revocable credentials)
        // So this will sort revocable credentials newest first and leave non-revocable ones in the order they were returned
        const sorted = res.data.sort((a, b) => {
            if (a.cred_info.cred_rev_id) {
                return b.cred_info.cred_rev_id - a.cred_info.cred_rev_id;
            }
            return 0;
        });
        // We then take the first credential that matches any given requested attribute
        const credentials: any = {};
        if (sorted) {
            for (const item of sorted) {
                for (const referent of item.presentation_referents) {
                    if (!credentials[referent]) {
                        credentials[referent] = item;
                    }
                }
            }
        }
        return credentials;
    }

    /*
       body is expected to be like this
        {
           "thread_id":"ce43593c-f901-4901-85ac-e3626f1f105b",
           "auto_present":true,
           "connection_id":"aec6fec1-6a6f-48b0-b7f6-042b64b103e0",
           "role":"prover",
           "initiator":"external",
           "presentation_exchange_id":"ca038aea-a259-44e3-841f-97c35702646a",
           "trace":false,
           "created_at":"2020-08-25 15:22:33.008804Z",
           "state":"request_received",
           "updated_at":"2020-08-25 15:22:33.008804Z",
           "presentation_request":{
              "name":"Proof of Score",
              "version":"1.0",
              "requested_attributes":{
                 "score":[
                    "Object"
                 ]
              },
              "requested_predicates":{

              },
              "nonce":"277942558705083816666541"
           }
        }


        for this handler, this will always be true:
        Route will be "topic"
        topic will be "present_proof"
     */
    public async handleAcapyWebhookMsg(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {

        if (route !== 'topic' || topic !== 'present_proof') {
            throw new ProtocolException(ProtocolErrorCode.AGENCY_GOVERNANCE, `${route}/${topic} is not valid.`);
        }

        // allow consumers to process proofs prior to and differently than provided by this handler.  If the callback
        // returns true (explicitly), it means this handlers code should not be executed.
        if (true === await this.agentGovernance.invokeHandler(agentUrl, agentId, adminApiKey, route, topic, body, token))
            return;

        const readPermission = async (governanceKey: string, cacheKey: string) => {
            this.agentGovernance.readPermission(Proofs.PROOFS_URL, governanceKey);
            await this.cache.set(cacheKey, {});
        };

        if (body.role === 'verifier' && body.state === 'presentation_received') {
            const action = 'verify-presentation';
            const templatedCacheKey = `${agentId}-${body.role as string}-${body.presentation_exchange_id as string}`;
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            const url: string = agentUrl + `/${Proofs.PROOFS_URL}/records/${body.presentation_exchange_id as string}/${action}`;
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);
            Logger.log(`requesting holder to present proof ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        if (body.role === 'prover' && body.state === 'request_received') {
            const presentationExchangeId: string = body.presentation_exchange_id;
            const action = 'send-presentation';
            const templatedCacheKey = `${agentId}-${body.role as string}-${presentationExchangeId}`;
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            // get credential
            let url: string = agentUrl + `/present-proof/records/${presentationExchangeId}/credentials`;
            const credentials: any = await this.getCredentialsByReferentId(url, adminApiKey, token);

            // Handle no matching credentials case
            if (Object.keys(credentials).length === 0) {
                Logger.warn('No matching credentials for proof request, sending problem-report');
                url = agentUrl + `/present-proof/records/${body.presentation_exchange_id as string}/problem-report`;
                const problemReportReq: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);
                // We send JSON encoded code & message to allow easily throwing a protocol exception
                problemReportReq.data = {
                    description: JSON.stringify({
                        code: ProtocolErrorCode.PROOF_FAILED_UNFULFILLED,
                        message: 'No credentials found to match proof request'
                    })
                };
                const problemReportRes = await this.http.requestWithRetry(problemReportReq);
                return problemReportRes.data;
            }

            // Continue constructing proof based on matching credentials
            const presentationRequest = body.presentation_request;
            const requested_attributes: any = {};
            const requested_predicates: any = {};
            const self_attested_attributes: any = {};       // note: we are not building any as we do not use self_attested attribs
                                                            // if proofs fail, look at this missing functionality

            for (const attributeKey in presentationRequest.requested_attributes) {
                if (credentials[attributeKey]) {
                    requested_attributes[attributeKey] = {
                        cred_id: credentials[attributeKey].cred_info.referent,
                        revealed: true
                    };
                }
            }

            for (const predicateKey in presentationRequest.requested_predicates) {
                if (credentials[predicateKey]) {
                    requested_predicates[predicateKey] = {
                        cred_id: credentials[predicateKey].cred_info.referent,
                    };
                }
            }

            const reply = { trace: false, requested_predicates, requested_attributes, self_attested_attributes };
            url = agentUrl + `/present-proof/records/${body.presentation_exchange_id as string}/${action}`;
            const req: AxiosRequestConfig = super.createHttpRequest(url, adminApiKey, token);
            req.data = reply;
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        Logger.debug(
            `doing nothing for '${agentId}': route '${route}': topic '${topic}': role '${body.role as string}': state '${body.state as string}'`);
        return;
    }
}

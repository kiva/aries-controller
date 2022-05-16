import { CacheStore, Logger } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common';
import { BaseAgentResponseHandler } from './base.agent.response.handler.js';
import { AgentGovernance } from '../agent.governance.js';

/*
 * Allows an agent to report a problem back to aries-guardianship-agency so that we can log it
 * We cache problem reports by thread id so that other processes can react to them if needed
*/
export class ProblemReport extends BaseAgentResponseHandler {
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    public async handleAcapyWebhookMsg(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {
        Logger.warn(`problem report from agent '${agentId}': ${JSON.stringify(body)}`);

        // allow consumers to process proofs prior to and differently than provided by this handler.  If the callback
        // returns true (explicitly), it means this handlers code should not be executed.
        if (true === await this.agentGovernance.invokeHandler(agentUrl, agentId, adminApiKey, route, topic, body, token))
            return;

        // Cache problem message by thread id
        if (body && body['~thread'] && body.description) {
            const threadId = body['~thread'].thid;
            await this.cache.set(threadId, body.description);
        }
        return 'ok';
    }
}

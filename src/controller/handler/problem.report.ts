import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { BaseAgentResponseHandler } from './base.agent.response.handler';
import { AgentGovernance } from '../agent.governance';

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
        // Cache problem message by thread id
        if (body && body['~thread'] && body['explain-ltxt']) {
            const threadId = body['~thread'].thid;
            await this.cache.set(threadId, body['explain-ltxt']);
        }
        return 'ok';
    }
}

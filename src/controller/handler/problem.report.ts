import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { BaseAgentResponseHandler } from './base.agent.response.handler';
import { AgentGovernance } from '../agent.governance';

/*
    Allows an agent to report a problem back to aries-guardianship-agency so that we
    can log it
*/
export class ProblemReport implements BaseAgentResponseHandler {
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
    }

    public async handlePost(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {
        Logger.warn(`problem report from agent '${agentId}': ${JSON.stringify(body)}`);
        return 'ok';
    }
}

import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';


export class RevocationRegistry implements IAgentResponseHandler {
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
    }

public async handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        Logger.warn(`Doing nothing in RevocationRegistry for '${agentId}': ${JSON.stringify(body)}`);
        return 'ok';
    }
}
import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';

/**
 * This handler is for any topics that don't require any special handling
 * We just log a debug message so we can see what's being called if we need to
 */
export class DoNothing implements IAgentResponseHandler {
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
    }

public async handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        Logger.warn(`Doing nothing for ${topic} for '${agentId}': ${JSON.stringify(body)}`);
        return 'ok';
    }
}

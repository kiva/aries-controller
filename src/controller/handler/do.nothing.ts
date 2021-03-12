import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { BaseAgentResponseHandler } from './base.agent.response.handler';
import { AgentGovernance } from '../agent.governance';

/**
 * This handler is for any topics that don't require any special handling
 * We just log a debug message so we can see what's being called if we need to
 */

export class DoNothing extends BaseAgentResponseHandler {
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    public async handlePost(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {
            Logger.debug(`Doing nothing for ${topic} for '${agentId}': ${JSON.stringify(body)}`);
            return 'ok';
    }
}

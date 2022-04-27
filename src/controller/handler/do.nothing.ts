import { CacheStore } from '@nestjs/common';
import { Logger, ProtocolHttpService } from 'protocol-common';
import { BaseAgentResponseHandler } from './base.agent.response.handler.js';
import { AgentGovernance } from '../agent.governance.js';

/**
 * This handler is for any topics that don't require any special handling
 * We just log a debug message so we can see what's being called if we need to
 */

export class DoNothing extends BaseAgentResponseHandler {
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    public async handleAcapyWebhookMsg(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {
            Logger.debug(`Doing nothing for ${topic} for '${agentId}': ${JSON.stringify(body)}`);
            return 'ok';
    }
}

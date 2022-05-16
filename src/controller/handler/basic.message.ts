import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { Logger } from 'protocol-common/logger';
import { BaseAgentResponseHandler } from './base.agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

/**
 * ResponseHandler for basic messages (aries RFC compliant). For now, bubbles up to consumers.
 */
export class BasicMessage extends BaseAgentResponseHandler {
    private static BASIC_MESSAGE = 'basic-message';
    private static GOVERNANCE_KEY = 'all';
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
        super();
    }

    public async handleAcapyWebhookMsg(
        agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string
    ): Promise<any> {
        const permissionState = this.agentGovernance.peekPermission(BasicMessage.BASIC_MESSAGE, BasicMessage.GOVERNANCE_KEY);
        if (AgentGovernance.PERMISSION_DENY === permissionState) {
            throw new ProtocolException(
                ProtocolErrorCode.AGENCY_GOVERNANCE,
                `${BasicMessage.GOVERNANCE_KEY} governance doesnt not allow basic message.`
            );
        }
        Logger.debug(`handling basic message for agent ${agentId}`, body);
        return this.agentGovernance.invokeHandler(agentUrl, agentId, adminApiKey, route, topic, body, token);
    }
}

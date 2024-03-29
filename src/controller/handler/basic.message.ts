import { Logger } from '@nestjs/common';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';
import { BaseAgentResponseHandler } from './base.agent.response.handler.js';
import { AgentGovernance } from '../agent.governance.js';

/**
 * ResponseHandler for basic messages (aries RFC compliant). For now, bubbles up to consumers.
 */
export class BasicMessage extends BaseAgentResponseHandler {
    private static BASIC_MESSAGE = 'basic-message';
    private static GOVERNANCE_KEY = 'all';
    constructor(private readonly agentGovernance: AgentGovernance) {
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

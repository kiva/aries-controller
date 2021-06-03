import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { IControllerHandler } from './controller.handler.interface';
import { ProfileManager } from '../profile/profile.manager';
import { AgentContext } from '../utility/agent.context';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * The handler for multi-controllers
 * The multi-controller loads it's values from the DB and it's AgentId from the request/auth token
 */
@Injectable()
export class MultiControllerHandler implements IControllerHandler {

    constructor(
        protected readonly profileManager: ProfileManager,
        @Inject(REQUEST) protected readonly req: Request,
        protected readonly agentContext: AgentContext
    ) { }

    /**
     * Loads the values to use for the multi controller from the DB
     */
    public async loadValues(): Promise<any> {
        const agentId = this.handleAgentId();
        const profile = await this.profileManager.get(agentId);

        if (!profile) {
            throw new ProtocolException(ProtocolErrorCode.NOT_REGISTERED, `No profile found for ${agentId}, need to register first`);
        }

        // The webhook url always points back to this controller, references the agent id
        const webhookUrl = `${process.env.SELF_URL}/v1/controller/${agentId}`;
        return {
            agentId,
            walletId: profile.walletId,
            walletKey: profile.walletKey,
            label: profile.label,
            controllerUrl: webhookUrl,
            adminApiKey: profile.adminApiKey ?? process.env.ADMIN_API_KEY,
            // below are just needed for single agents
            seed: profile.seed,
            useTailsServer: profile.useTailsServer,
        };
    }

    /**
     * When the guard is disabled (eg local) we get the agent id off the agent header
     * Otherwise (eg non-local) we get it from the Auth0 token
     */
    public handleAgentId(): string {
        return this.agentContext.getAgentId((process.env.AGENT_GUARD_ENABLED === 'true'));
    }

    /**
     * For convenience agent id can be passed in rather than fetching it from handleAgentId
     * The adminApiKey is pulled of the profile for single agents?
     */
    public async handleAdminApiKey(agentId?: string): Promise<string> {
        agentId = agentId ?? this.handleAgentId();
        const profile = await this.profileManager.get(agentId);
        if (!profile) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, `No profile found for ${agentId}`);
        }
        return profile.adminApiKey;
    }
}

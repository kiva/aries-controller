import { Injectable } from '@nestjs/common';
import { ProtocolException, ProtocolErrorCode } from 'protocol-common';
import { IControllerHandler } from './controller.handler.interface.js';
import { AgentContext } from '../utility/agent.context.js';
import { SecretsManager } from '../profile/secrets.manager.js';

/**
 * The handler for multi-controllers
 * The multi-controller loads it's values from the DB and it's AgentId from the request/auth token
 */
@Injectable()
export class MultiControllerHandler implements IControllerHandler {

    constructor(
        protected readonly secretsManager: SecretsManager,
        protected readonly agentContext: AgentContext
    ) { }

    /**
     * Loads the values to use for the multi controller from the DB
     */
    public async loadValues(): Promise<any> {
        const agentId = this.handleAgentId();
        const profile = await this.secretsManager.get(agentId);

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
        const guardEnabled = !(process.env.AGENT_GUARD_ENABLED === 'false');
        return this.agentContext.getAgentId(guardEnabled);
    }

    /**
     * For convenience agent id can be passed in rather than fetching it from handleAgentId
     * The adminApiKey is pulled of the profile for single agents?
     */
    public async handleAdminApiKey(agentId?: string): Promise<string> {
        agentId = agentId ?? this.handleAgentId();
        const profile = await this.secretsManager.get(agentId);
        if (!profile) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, `No profile found for ${agentId}`);
        }
        return profile.adminApiKey;
    }
}

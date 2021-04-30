import { Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { BaseControllerHandler } from './base.controller.handler';
import { IControllerHandler } from './controller.handler.interface';

/**
 * The handler for multi-controllers
 * The multi-controller loads it's values from the DB and it's AgentId from the request/auth token
 */
@Injectable()
export class MultiControllerHandler extends BaseControllerHandler implements IControllerHandler {

    /**
     * Loads the values to use for the multi controller from the DB
     */
    public async loadValues(): Promise<any> {
        const agentId = this.handleAgentId();
        const profile = await this.profileManager.get(agentId);

        if (!profile) {
            throw new ProtocolException('NotRegistered', `No profile found for ${agentId}, need to register first`);
        }

        return {
            agentId,
            walletId: profile.walletId,
            walletKey: profile.walletKey,
            label: profile.label,
            controllerUrl: profile.controllerUrl,
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
        // TODO change name to AgentId gaurd?
        if (process.env.INSTITUTION_GUARD_ENABLED === 'false') {
            Logger.debug('Allowing user since institution guard is disabled');
            return this.getFromAgentHeader();
        }

        // Check Auth0 and pull from there
        return this.getFromAuthHeader();
    }

    public async handleAdminApiKey(): Promise<string> {
        const agentId = this.handleAgentId();
        const profile = await this.profileManager.get(agentId);
        if (!profile) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, `No profile found for ${agentId}`);
        }
        return profile.adminApiKey;
    }

    /**
     * This is just used for local testing
     */
     private getFromAgentHeader(): string {
        const agentHeader = this.req.headers.agent;
        if (!agentHeader) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: No agent header', null, 403);
        }
        return agentHeader;
    }
}

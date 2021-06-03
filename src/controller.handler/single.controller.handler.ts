import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { IControllerHandler } from './controller.handler.interface';
import { ProfileManager } from '../profile/profile.manager';
import { AgentContext } from 'protocol-common/agent.context';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * Single controllers can fetch all values from env vars
 */
@Injectable()
export class SingleControllerHandler implements IControllerHandler {

    constructor(
        protected readonly profileManager: ProfileManager,
        @Inject(REQUEST) protected readonly req: Request,
        protected readonly agentContext: AgentContext
    ) { }

    /**
     * Loads the values to use for the multi controller
     * This is only async because the multi-controller handler needs to be
     */
    public async loadValues(): Promise<any> {
        const agentId = this.handleAgentId();
        // The webhook url always points back to this controller, references the agent id
        const webhookUrl = `${process.env.SELF_URL}/v1/controller/${agentId}`;
        return {
            agentId,
            walletId: process.env.WALLET_ID,
            walletKey: process.env.WALLET_KEY,
            label: process.env.LABEL,
            controllerUrl: webhookUrl,
            adminApiKey: process.env.ADMIN_API_KEY,
            // below are just needed for single agents
            seed: process.env.SEED,
            useTailsServer: (process.env.USE_TAILS_SERVER === 'true'),
        };
    }

    /**
     * Single controllers must have an AGENT_ID configured as an env var
     */
    public handleAgentId(): string {
        if (!process.env.AGENT_ID) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_CONFIGURATION, 'Must configure AGENT_ID for this controller');
        }
        return process.env.AGENT_ID;
    }

    /**
     * For single controllers the api key is saved as an env var
     */
    public async handleAdminApiKey(): Promise<string> {
        return process.env.ADMIN_API_KEY;
    }
}

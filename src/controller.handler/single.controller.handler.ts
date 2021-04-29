import { Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { BaseControllerHandler } from './base.controller.handler';
import { IControllerHandler } from './controller.handler.interface';

/**
 *
 */
@Injectable()
export class SingleControllerHandler extends BaseControllerHandler implements IControllerHandler {

    /**
     * Loads the values to use for the multi controller
     * This is only async because the multi-controller handler needs to be
     */
    public async loadValues(): Promise<any> {
        const agentId = this.handleAgentId();
        return {
            agentId,
            walletId: process.env.WALLET_ID,
            walletKey: process.env.WALLET_KEY,
            label: process.env.LABEL,
            controllerUrl: process.env.SELF_URL + '/v1/controller',
            adminApiKey: process.env.ADMIN_API_KEY,
            // below are just needed for single agents
            seed: process.env.SEED,
            useTailsServer: (process.env.USE_TAILS_SERVER === 'true'),
        };
    }

    public handleAgentId(): string {
        if (!process.env.AGENT_ID) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_CONFIGURATION, 'Must configure institution for this controller');
        }

        // TODO change name to AgentId gaurd?
        if (process.env.INSTITUTION_GUARD_ENABLED === 'false') {
            Logger.debug('Allowing user since institution guard is disabled');
            return process.env.AGENT_ID;
        }

        // Check Auth0 and pull from there
        const institution = this.getFromAuthHeader();

        if (process.env.ALLOW_ADMIN_INSTITUTION === 'true' && institution === 'admin') {
            Logger.debug('Allowing admin user');
            return institution;
        }

        // Lower case comparison to avoid false negatives
        if (institution !== process.env.AGENT_ID) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: institution doesn\'t match configured institution', null, 403);
        }
        return institution;
    }
}

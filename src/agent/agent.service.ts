import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProtocolException, ProtocolErrorCode, LOWER_CASE_LETTERS, NUMBERS, randomString } from 'protocol-common';
import { CALLER, ICaller } from '../caller/caller.interface.js';
import { CONTROLLER_HANDLER, IControllerHandler } from '../controller.handler/controller.handler.interface.js';
import { ProfileManager } from '../profile/profile.manager.js';
import { SecretsManager } from '../profile/secrets.manager.js';

/**
 * TODO abstract out a base service that includes things like making connections
 */
@Injectable()
export class AgentService {

    constructor(
        private readonly profileManager: ProfileManager,
        private readonly secretsManager: SecretsManager,
        @Inject(CALLER) private readonly agentCaller: ICaller,
        @Inject(CONTROLLER_HANDLER) private readonly controllerHandler: IControllerHandler,
    ) {}

    /**
     * Spin up agent
     * If AGENCY_DEPLOY is unset then we still deploy, only if explicitly set to false do we not deploy
     * This maintains the status quo by default, and we can set each controller to false as we update each agent deployment
     */
    public async init(): Promise<any> {
        if (process.env.AGENCY_DEPLOY === 'false') {
            return null;
        }
        return await this.agentCaller.spinUpAgent();
    }

    /**
     * Resets an agent by first spinning down old instance and then spins up new instance
     */
    public async spinDown(): Promise<any> {
        await this.agentCaller.spinDownAgent();
    }

    public async openConnection(): Promise<any> {
        const data = await this.agentCaller.callAgent('POST', 'connections/create-invitation');
        if (process.env.IMAGE_URL) {
            data.invitation.imageUrl = process.env.IMAGE_URL;
        }
        // Remove invitation_url since it doesn't work and can confuse consumers
        delete data.invitation.invitation_url;
        return data;
    }

    // TODO update to accept a null alias (switch the order on acceptConnection)
    public async acceptConnection(alias: string, invitation: any): Promise<any> {
        const params = {
            alias
        };
        return await this.agentCaller.callAgent('POST', 'connections/receive-invitation', params, invitation);
    }

    public async checkConnection(connectionId: string): Promise<any> {
        return await this.agentCaller.callAgent('GET', `connections/${connectionId}`);
    }

    public async sendPing(connectionId: string, comment = 'ping'): Promise<any> {
        const data = {
            comment
        };
        return await this.agentCaller.callAgent('POST', `connections/${connectionId}/send-ping`, null, data);
    }

    public async publicizeDid(did: string): Promise<any> {
        const params = {
            did,
        };
        return await this.agentCaller.callAgent('POST', 'wallet/did/public', params);
    }

    /**
     * Deletes credential using the cred_id for issuer
     */
    public async deleteCredential(credId: string): Promise<any> {
        return await this.agentCaller.callAgent('DELETE', `credential/${credId}`);
    }

    /**
     *  Deletes connection between agents
     */
    public async deleteConnection(connectionId: string): Promise<any> {
        return await this.agentCaller.callAgent('DELETE', `connections/${connectionId}`);
    }

    /**
     * Just a pass through function to the underlying agentCaller
     */
    public async callAgent(method: any, route: string, params?: any, data?: any): Promise<any> {
        return await this.agentCaller.callAgent(method, route, params, data);
    }


    /**
     *   Common functionality for sending a basic message.  Built for transaction history system but can
     *   be used in any case for sending basic messages.
     *
     *   @content {any} must be an object.  the format of content depends on the message. For transaction history, see the design doc.
     *   @connectionID {string} connection Id associated with the agent receiving the message
     */
    public async sendBasicMessage(msg: any, connectionId: string) : Promise<any> {
        Logger.debug(`sending basic message ${process.env.AGENT_ID}`, msg);
        const data = { content: JSON.stringify(msg) };
        return await this.agentCaller.callAgent('POST', `connections/${connectionId}/send-message`, null, data);
    }

    /**
     * Saves new controller data to the profile manager and spins up it's agent
     * The agentId should come off the agent context, and the wallet id & key are generated randomly
     * Note: if we allowed users to generate their own wallet id the could potentially hijack another's wallet
     */
    public async registerController(profile: any) {
        if (process.env.MULTI_CONTROLLER !== 'true') {
            throw new ProtocolException(ProtocolErrorCode.FORBIDDEN_EXCEPTION, 'Can only register in multi-controller mode');
        }

        profile.agentId = this.controllerHandler.handleAgentId();
        const exists = await this.secretsManager.get(profile.agentId);
        if (exists) {
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Agent id ${profile.agentId as string} is already registered`);
        }
        profile.walletId = randomString(32, LOWER_CASE_LETTERS + NUMBERS);
        profile.walletKey = randomString(32);
        await this.secretsManager.save(profile.agentId, profile);
        await this.init();
        return profile;
    }

    public async initProfilesFromDisk(): Promise<void> {
        try {
            await this.profileManager.initFromDisk();
        } catch (e) {
            Logger.warn('Failed to load profiles, this is ok if no profiles folder is included', e);
        }
    }
}

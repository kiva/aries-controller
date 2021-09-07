import { CacheStore, CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { LOWER_CASE_LETTERS, NUMBERS, randomString } from 'protocol-common/random.string.generator';
import { CALLER, ICaller } from '../caller/caller.interface';
import { ProfileManager } from '../profile/profile.manager';
import { CONTROLLER_HANDLER, IControllerHandler } from '../controller.handler/controller.handler.interface';

/**
 * TODO abstract out a base service that includes things like making connections
 */
@Injectable()
export class AgentService {

    constructor(
        private readonly profileManager: ProfileManager,
        @Inject(CALLER) private readonly agentCaller: ICaller,
        @Inject(CONTROLLER_HANDLER) private readonly controllerHandler: IControllerHandler,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
    ) {}

    /**
     * Spin up agent
     */
    public async init(): Promise<any> {
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
            throw new ProtocolException(ProtocolErrorCode.FORBIDDEN_EXCEPTION, `Can only register in multi-controller mode`);
        }

        profile.agentId = this.controllerHandler.handleAgentId();
        const exists = await this.profileManager.get(profile.agentId);
        if (exists) {
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Agent id ${profile.agentId} is already registered`);
        }

        profile.walletId = randomString(32, LOWER_CASE_LETTERS + NUMBERS);
        profile.walletKey = randomString(32);

        await this.profileManager.save(profile.agentId, profile);
        await this.init();
        return profile;
    }

    public async initProfilesFromDisk(): Promise<void> {
        await this.profileManager.initFromDisk();
    }


}

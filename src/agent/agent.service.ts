import { Inject, Injectable } from '@nestjs/common';
import { ICaller } from '../caller/caller.interface';
import { Logger } from 'protocol-common/logger';

/**
 * TODO abstract out a base service that includes things like making connections
 */
@Injectable()
export class AgentService {

    constructor(
        @Inject('CALLER') private readonly agentCaller: ICaller,
    ) {}

    /**
     * TODO we could add some error handling/retry logic here if the agent doesn't spin up correctly the first time
     */
    public async init(): Promise<any> {
        // setup agent to use the webhook and governance policy handler built in
        const controllerUrl = process.env.SELF_URL + '/v1/controller';
        return await this.agentCaller.spinUpAgent(
            // process.env.WALLET_ID,
            // process.env.WALLET_KEY,
            // process.env.ADMIN_API_KEY,
            // process.env.SEED,
            // controllerUrl,
            // process.env.AGENT_ID,
            // process.env.LABEL,
            // (process.env.USE_TAILS_SERVER === 'true'),
        );
    }

    public async openConnection(): Promise<any> {
        const data = await this.agentCaller.callAgent(process.env.AGENT_ID, 'POST', 'connections/create-invitation');
        data.invitation.imageUrl = process.env.IMAGE_URL || '';
        // Remove invitation_url since it doesn't work and can confuse consumers
        delete data.invitation.invitation_url;
        return data;
    }

    // TODO update to accept a null alias (switch the order on acceptConnection)
    public async acceptConnection(alias: string, invitation: any): Promise<any> {
        const params = {
            alias
        };
        return await this.agentCaller.callAgent(
            process.env.AGENT_ID,
            'POST',
            'connections/receive-invitation',
            params,
            invitation
        );
    }

    public async checkConnection(connectionId: string): Promise<any> {
        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'GET', `connections/${connectionId}`);
    }

    public async sendPing(connectionId: string, comment = 'ping'): Promise<any> {
        const data = {
            comment
        };
        return await this.agentCaller.callAgent(
            process.env.AGENT_ID,
            'POST',
            `connections/${connectionId}/send-ping`,
            null,
            data,
        );
    }

    public async publicizeDid(did: string): Promise<any> {
        const params = {
            did,
        };
        return await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'POST', 'wallet/did/public', params);
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
        return await this.agentCaller.callAgent(
            process.env.AGENT_ID,
            'POST',
            `connections/${connectionId}/send-message`,
            null,
            data
        );
    }
}

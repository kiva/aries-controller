import { Injectable, Logger } from '@nestjs/common';
import { AgentCaller } from './agent.caller';
import { readdirSync, readFileSync } from 'fs';

/**
 * TODO abstract out a base service that includes things like making connections
 */
@Injectable()
export class AgentService {

    constructor(
        private readonly agentCaller: AgentCaller,
    ) {}

    /**
     * TODO we could add some error handling/retry logic here if the agent doesn't spin up correctly the first time
     */
    public async init(): Promise<any> {
        // setup agent to use the webhook and governance policy handler built in
        const controllerUrl = process.env.SELF_URL + '/v1/controller';
        return await this.agentCaller.spinUpAgent(
            process.env.WALLET_ID,
            process.env.WALLET_KEY,
            process.env.ADMIN_API_KEY,
            process.env.SEED,
            controllerUrl,
            process.env.AGENT_ID,
            process.env.LABEL,
        );
    }

    public async openConnection(): Promise<any> {
        const data = await this.agentCaller.callAgent(process.env.AGENT_ID, process.env.ADMIN_API_KEY, 'POST', 'connections/create-invitation');
        data.invitation.imageUrl = process.env.IMAGE_URL || '';
        // Remove invitation_url since it doesn't work and can confuse consumers
        delete data.invitation.invitation_url;
        return data;
    }

    public async acceptConnection(alias: string, invitation: any): Promise<any> {
        const params = {
            alias
        };
        return await this.agentCaller.callAgent(
            process.env.AGENT_ID,
            process.env.ADMIN_API_KEY,
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
            process.env.ADMIN_API_KEY,
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

    public getProfiles() {
        const profilesDir = process.cwd() + '/profiles/';
        const fileNames = readdirSync(profilesDir);
        const files = {};
        for (const fileName of fileNames) {
            const file = readFileSync(profilesDir + fileName).toString();
            const fileData = JSON.parse(file);
            if (fileData.DEFAULT) {
                files[fileName] = {...fileData.DEFAULT, ...fileData[process.env.NODE_ENV]};
            } else {
                files[fileName] = fileData;
            }
        }
        Logger.log(files);
        return files;
    }
}

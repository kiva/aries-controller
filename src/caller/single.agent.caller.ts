import { Injectable, HttpService } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ICaller } from './caller.interface';

/**
 * TODO add types
 * TODO add more comments
 */
@Injectable()
export class SingleAgentCaller implements ICaller {

    private readonly http: ProtocolHttpService;

    /**
     * 
     */
    constructor(
        httpService: HttpService,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * Makes a call to the agency to spin up an agent, this can work in 
     */
    public async spinUpAgent(): Promise<any> {
        
        let walletId;
        let walletKey;
        let adminApiKey;
        let seed;
        let controllerUrl;
        let agentId;
        let label;
        let useTailsServer;
        if (process.env.MULTI_CONTROLLER === 'true') {
            // fetch from DB

            // admin key is universal for multi controller
            adminApiKey = process.env.ADMIN_API_KEY;
        } else {
            walletId = process.env.WALLET_ID;
            walletKey = process.env.WALLET_KEY;
            adminApiKey = process.env.ADMIN_API_KEY;
            seed = process.env.SEED;
            controllerUrl = process.env.SELF_URL + '/v1/controller';
            agentId = process.env.AGENT_ID;
            label = process.env.LABEL;
            useTailsServer = (process.env.USE_TAILS_SERVER === 'true');
        }

        let req: AxiosRequestConfig;
        req = {
            method: 'POST',
            url: process.env.AGENCY_URL + '/v1/manager',
            data: {
                walletId,
                walletKey,
                adminApiKey,
                seed,
                controllerUrl,
                agentId,
                label,
                useTailsServer,
                ttl: 2147483, // This is the max ttl supported by setTimeout - TODO swap this to 0 when the agency is ready for it
                autoConnect: false,
            }
        };
        Logger.log(`Spinning up agent ${agentId}`);
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${agentId}`);
        return res.data;
    }

    /**
     * TODO we can abstract away the method and route to just be a command that looks up the method and route
     * TODO should handle the case where a call is made but the agent isn't up (in both single and multi)
     */
    public async callAgent(agentId: string, method: any, route: string, params?: any, data?: any): Promise<any> {
        const adminApiKey = process.env.ADMIN_API_KEY;
        let url;
        let req: AxiosRequestConfig;
        if (process.env.MULTI_CONTROLLER === 'true') {
            agentId == ''; //TODO passed in via request
        } else {
            agentId = process.env.AGENT_ID
        }
        url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/${route}`;
        req = {
            method,
            url,
            params,
            data,
            headers: {
                'x-api-key': adminApiKey,
            },
        };
        
        // TODO remove logging or make cleaner
        try {
            Logger.log(`Calling agent ${url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        } catch (e) {
            Logger.warn(`Agent call failed to ${url} with ${JSON.stringify(data)}`, e);
            throw new ProtocolException(ProtocolErrorCode.AGENT_CALL_FAILED, `Agent: ${e.message}`, { agentRoute: route, ex: e.details });
        }
    }

}

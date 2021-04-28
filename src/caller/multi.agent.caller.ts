import { Injectable, HttpService, CacheStore, Inject, CACHE_MANAGER } from '@nestjs/common';
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
export class MultiAgentCaller implements ICaller {

    private readonly http: ProtocolHttpService;

    /**
     * 
     */
    constructor(
        httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
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
            // TODO fetch from DB
            walletId = process.env.WALLET_ID;
            walletKey = process.env.WALLET_KEY;
            label = process.env.LABEL;
            agentId = process.env.AGENT_ID;
            controllerUrl = process.env.SELF_URL + '/v1/controller'; // TODO this endpoint needs to handle multi webhook responses
        } else {
            walletId = process.env.WALLET_ID;
            walletKey = process.env.WALLET_KEY;
            label = process.env.LABEL;
            agentId = process.env.AGENT_ID;
            controllerUrl = process.env.SELF_URL + '/v1/controller';
        }
        // admin key is universal for multi controller
        adminApiKey = process.env.ADMIN_API_KEY;

        let req: AxiosRequestConfig;
        req = {
            method: 'POST',
            url: process.env.AGENCY_URL + '/v2/multitenant',
            data: {
                walletName: walletId,
                walletKey,
                label,
                controllerUrl,
                ttl: 2147483, // This is the max ttl supported by setTimeout - TODO swap this to 0 when the agency is ready for it
                autoConnect: false,
            }
        };
        Logger.log(`Spinning up agent ${agentId}`);
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${agentId}`);
        if (!res || !res.data || !res.data.token) {
            Logger.error('NO TOKEN!', res.data);
        }
        await this.cache.set('token_' + agentId, res.data.token);
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
        url = `${process.env.MULTITENANT_URL}/${route}`;
        // TODO need the agentId/institution passed in from the request in order to look up the cached value
        const token = await this.cache.get('token_' + agentId); //TODO get token from cache and handle cache miss
        req = {
            method,
            url,
            params,
            data,
            headers: {
                'x-api-key': adminApiKey,
                'authorization': 'Bearer ' + token
            },
        };
        
        // TODO remove logging or make cleaner
        try {
            Logger.log(`Calling agent ${url}`, req);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        } catch (e) {
            Logger.warn(`Agent call failed to ${url} with ${JSON.stringify(data)}`, e);
            throw new ProtocolException(ProtocolErrorCode.AGENT_CALL_FAILED, `Agent: ${e.message}`, { agentRoute: route, ex: e.details });
        }
    }

}

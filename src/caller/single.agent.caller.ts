import { Injectable, HttpService, CacheStore, CACHE_MANAGER, Inject } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ICaller } from './caller.interface';
import { IControllerHandler } from '../controller.handler/controller.handler.interface';

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
        @Inject('CONTROLLER_HANDLER') private readonly controllerHandler: IControllerHandler,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * Makes a call to the agency to spin up an agent, this can work in
     */
    public async spinUpAgent(): Promise<any> {
        const profile = await this.controllerHandler.loadValues();

        let req: AxiosRequestConfig;
        req = {
            method: 'POST',
            url: process.env.AGENCY_URL + '/v1/manager',
            data: {
                walletId: profile.walletId,
                walletKey: profile.walletKey,
                adminApiKey: profile.adminApiKey,
                seed: profile.seed,
                controllerUrl: profile.controllerUrl,
                agentId: profile.agentId,
                label: profile.label,
                useTailsServer: profile.useTailsServer,
                ttl: 2147483, // This is the max ttl supported by setTimeout - TODO swap this to 0 when the agency is ready for it
                autoConnect: false,
            }
        };
        Logger.log(`Spinning up agent ${profile.agentId}`);
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${profile.agentId}`);
        return res.data;
    }

    /**
     * TODO we can abstract away the method and route to just be a command that looks up the method and route
     * TODO should handle the case where a call is made but the agent isn't up (in both single and multi)
     */
    public async callAgent(method: any, route: string, params?: any, data?: any): Promise<any> {
        const agentId = this.controllerHandler.handleAgentId();
        Logger.log('agentId', agentId);
        const adminApiKey = process.env.ADMIN_API_KEY;
        let url;
        let req: AxiosRequestConfig;
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

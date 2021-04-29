import { Injectable, HttpService, Inject } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ICaller } from './caller.interface';
import { IControllerHandler } from '../controller.handler/controller.handler.interface';
import { ProfileManager } from '../controller.handler/profile.manager';

/**
 * Handles all calls to the multitenant aca-py agent
 */
@Injectable()
export class MultiAgentCaller implements ICaller {

    private readonly http: ProtocolHttpService;

    constructor(
        httpService: HttpService,
        private readonly profileManger: ProfileManager,
        @Inject('CONTROLLER_HANDLER') private readonly controllerHandler: IControllerHandler,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * Makes a call to the agency to spin up an agent in multitenancy
     */
    public async spinUpAgent(): Promise<any> {
        const profile = await this.controllerHandler.loadValues();
        const req: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.AGENCY_URL + '/v2/multitenant',
            data: {
                walletName: profile.walletId,
                walletKey: profile.walletKey,
                label: profile.label,
                controllerUrl: profile.controllerUrl,
                ttl: 2147483, // This is the max ttl supported by setTimeout - TODO swap this to 0 when the agency is ready for it
                autoConnect: false,
            }
        };
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${profile.agentId}`);
        if (!res || !res.data || !res.data.token) {
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, `No token after spinning up agent ${profile.agentId}`);
        }
        await this.profileManger.append(profile.agentId, 'token', res.data.token);
        return res.data;
    }

    /**
     * Calls a multitenant agent using the stored token
     */
    public async callAgent(method: any, route: string, params?: any, data?: any): Promise<any> {
        // The admin api key will always be the one for multitenant stored as an env
        const adminApiKey = process.env.ADMIN_API_KEY;
        const url = `${process.env.MULTITENANT_URL}/${route}`;
        const agentId = this.controllerHandler.handleAgentId();
        const profile = await this.profileManger.get(agentId);
        const token = profile.token;
        if (!token) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, 'No token, agent has not been registered');
        }
        const req: AxiosRequestConfig = {
            method,
            url,
            params,
            data,
            headers: {
                'x-api-key': adminApiKey,
                'authorization': 'Bearer ' + token
            },
        };

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

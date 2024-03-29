import { Injectable, Inject, Logger } from '@nestjs/common';
import { ProtocolHttpService, ProtocolException, ProtocolErrorCode, Constants } from 'protocol-common';
import { AxiosRequestConfig } from 'axios';
import { ICaller } from './caller.interface.js';
import { IControllerHandler, CONTROLLER_HANDLER } from '../controller.handler/controller.handler.interface.js';
import { SecretsManager } from '../profile/secrets.manager.js';

/**
 * Handles all calls to the multitenant aca-py agent
 */
@Injectable()
export class MultiAgentCaller implements ICaller {

    constructor(
        private readonly http: ProtocolHttpService,
        private readonly secretsManger: SecretsManager,
        @Inject(CONTROLLER_HANDLER) private readonly controllerHandler: IControllerHandler,
    ) {}

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
                ttl: 0, // live indefinitely
                autoConnect: false,
                returnToken: true
            }
        };
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${profile.agentId as string}`);
        if (!res || !res.data || !res.data.token) {
            Logger.warn('No token', res.data);
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, `No token after spinning up agent ${profile.agentId as string}`);
        }
        await this.secretsManger.append(profile.agentId, 'token', res.data.token);
        return res.data;
    }

    /**
     * Calls a multitenant agent using the stored token
     */
    public async callAgent(method: any, route: string, params?: any, data?: any, retry = true): Promise<any> {
        // When calling the multi agent the admin api key is always from the env - it's the multitenant api key
        const adminApiKey = process.env.ADMIN_API_KEY;
        const agentId = this.controllerHandler.handleAgentId();
        const profile = await this.secretsManger.get(agentId);
        if (!profile) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, 'No profile, agent has not been registered');
        }
        const token: string = profile.token;
        if (!token) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, 'No token, agent has not been initialized');
        }

        const url = `${process.env.MULTITENANT_URL}/${route}`;
        const req: AxiosRequestConfig = {
            method,
            url,
            params,
            data,
            headers: {
                'x-api-key': adminApiKey,
                'authorization': `Bearer ${token}`
            },
        };

        try {
            Logger.log(`Calling agent ${url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        } catch (e) {
            // If the multitenant responds with unauthorized, and we have a token (checked above), that generally means we should re-register
            if (retry && e.details === '401: Unauthorized') {
                Logger.warn('Agent is not registered, re-registering...');
                await this.spinUpAgent();
                return await this.callAgent(method, route, params, data, false);
            }
            Logger.warn(`Agent call failed to ${url} with ${JSON.stringify(data)}`, e);
            if (process.env.NODE_ENV === Constants.PROD) {
                throw new ProtocolException(ProtocolErrorCode.AGENT_CALL_FAILED, 'Agent call failed');
            }
            throw new ProtocolException(ProtocolErrorCode.AGENT_CALL_FAILED, `Agent: ${e.message as string}`, { agentRoute: route, ex: e.details });
        }
    }

    /**
     * Makes a call to the agency to spin down an agent in multitenancy
     */
     public async spinDownAgent(): Promise<any> {
        const profile = await this.controllerHandler.loadValues();
        const req: AxiosRequestConfig = {
            method: 'DELETE',
            url: process.env.AGENCY_URL + '/v2/multitenant',
            data: {
                walletName: profile.walletId,
                walletKey: profile.walletKey,
            }
        };
        const res = await this.http.requestWithRetry(req);
        return res.data;
    }
}

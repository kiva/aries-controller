import { Injectable, Inject, Logger } from '@nestjs/common';
import { ProtocolHttpService, ProtocolException, ProtocolErrorCode, ProtocolUtility, Constants } from 'protocol-common';
import { AxiosRequestConfig } from 'axios';
import { ICaller } from './caller.interface.js';
import { IControllerHandler, CONTROLLER_HANDLER } from '../controller.handler/controller.handler.interface.js';

/**
 * Caller for a single agent
 */
@Injectable()
export class SingleAgentCaller implements ICaller {

    constructor(
        private readonly http: ProtocolHttpService,
        @Inject(CONTROLLER_HANDLER) private readonly controllerHandler: IControllerHandler,
    ) {}

    /**
     * Makes a call to the agency to spin up an agent
     */
    public async spinUpAgent(): Promise<any> {
        const profile = await this.controllerHandler.loadValues();
        const req: AxiosRequestConfig = {
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
                ttl: 0, // live indefinitely
                autoConnect: false,
            }
        };
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${profile.agentId as string}`);
        return res.data;
    }

    /**
     * Calls a single agent, which is on our docker network by agentId
     * If the agent is down when we call, we attempt to spin it up and then retry the call one more time
     */
    public async callAgent(method: any, route: string, params?: any, data?: any, retry = true): Promise<any> {
        // For single agent callers, the api key will either be in the env (if single controller), or stored in the profile (for multi controller)
        // This logic is handled by the IControllerHandler instance
        const adminApiKey = await this.controllerHandler.handleAdminApiKey();
        const agentId = this.controllerHandler.handleAgentId();

        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/${route}`;
        const req: AxiosRequestConfig = {
            method,
            url,
            params,
            data,
            headers: {
                'x-api-key': adminApiKey,
            },
        };

        try {
            Logger.log(`Calling agent ${url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        } catch (e) {
            if (
                retry && e.details &&
                (e.details.code === 'ENOTFOUND' || e.details.code === 'ECONNREFUSED' || (e.message && e.message.includes('EAI_AGAIN')))
            ) {
                Logger.warn('Agent is down, restarting...');
                await this.spinUpAgent();
                // Single agents need a delay since they're slow to come up
                await ProtocolUtility.delay(3000);
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
     * Makes a call to the agency to spin down an agent
     */
    public async spinDownAgent(): Promise<any> {
        const profile = await this.controllerHandler.loadValues();
        const req: AxiosRequestConfig = {
            method: 'DELETE',
            url: process.env.AGENCY_URL + '/v1/manager',
            data: {
                agentId: profile.agentId,
            }
        };
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun down agent ${profile.agentId as string}`);
        return res.data;
    }
}

import { Injectable, HttpService, Inject } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ICaller } from './caller.interface';
import { IControllerHandler } from '../controller.handler/controller.handler.interface';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * Caller for a single agent
 */
@Injectable()
export class SingleAgentCaller implements ICaller {

    private readonly http: ProtocolHttpService;

    constructor(
        httpService: HttpService,
        @Inject('CONTROLLER_HANDLER') private readonly controllerHandler: IControllerHandler,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * Makes a call to the agency to spin up an agent, this can work in
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
                ttl: 2147483, // This is the max ttl supported by setTimeout - TODO swap this to 0 when the agency is ready for it
                autoConnect: false,
            }
        };
        const res = await this.http.requestWithRetry(req);
        Logger.log(`Successfully spun up agent ${profile.agentId}`);
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
            if (retry && e.details && (e.details.code === 'ENOTFOUND' || e.details.code === 'ECONNREFUSED')) {
                Logger.warn('Agent is down, restarting...');
                await this.spinUpAgent();
                // Single agents need a delay since they're slow to come up
                await ProtocolUtility.delay(3000);
                return await this.callAgent(method, route, params, data, false);
            }
            Logger.warn(`Agent call failed to ${url} with ${JSON.stringify(data)}`, e);
            throw new ProtocolException(ProtocolErrorCode.AGENT_CALL_FAILED, `Agent: ${e.message}`, { agentRoute: route, ex: e.details });
        }
    }
}

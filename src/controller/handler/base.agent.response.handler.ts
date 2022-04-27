import { AxiosRequestConfig } from 'axios';
import { IAgentResponseHandler } from './agent.response.handler.js';

/*
    This class contains functions found in derived classes.  This class should never
    be allocated directly, create a derived class.
*/
export abstract class BaseAgentResponseHandler implements IAgentResponseHandler {

    public createHttpRequest(url: string, adminApiKey: string, token?: string): AxiosRequestConfig {
        const req: AxiosRequestConfig = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': adminApiKey,
            }
        };
        if (token) {
            req.headers.Authorization = 'Bearer ' + token;
        }
        return req;
    }

    abstract handleAcapyWebhookMsg(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string,
                            body: any, token?: string): Promise<any>;
}

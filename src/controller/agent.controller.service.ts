import { Injectable, HttpService, Inject, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { AgentGovernance } from './agent.governance';
import { HandlersFactory } from './handler/handlers.factory';
import { SecretsManager } from '../profile/secrets.manager';

/**
 * Handler for ACAPY "webhook" endpoints, which allows agents to automatically respond to agent messages
 * according to the governance policy setup.  See [../config/governance.json] for configurations.
 */
@Injectable()
export class AgentControllerService {

    private readonly http: ProtocolHttpService;

    constructor(
        httpService: HttpService,
        private readonly secretsManager: SecretsManager,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * TODO right now I'm duplicating a lot of the multi/single agent/controller logic because I don't want to refactor the HandlersFactory yet
     *      Eventually that will take an ICaller and so we won't need logic here to extract agentUrl, adminApiKey and token
     *      This work if captured in this ticket: https://kiva.atlassian.net/browse/PRO-3012
     */
    public async handleRequest(agentId: string, route: string, topic: string, body: any) {
        const profile: any = await this.secretsManager.get(agentId);

        // Logic for adminApiKey - eventually this will all be handled by ICaller
        let adminApiKey;
        if (profile && profile.adminApiKey) {
            adminApiKey = profile.adminApiKey;
        } else {
            adminApiKey = process.env.ADMIN_API_KEY;
        }
        if (!adminApiKey) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_NODE_ENVIRONMENT, 'admin api key is missing from environment');
        }

        // Logic for agentUrl - eventually this will all be handled by ICaller
        let agentUrl;
        if (process.env.MULTI_AGENT === 'true') {
            agentUrl = process.env.MULTITENANT_URL;
        } else {
            const adminPort: string = ((profile && profile.adminApiPort) ? profile.adminApiPort : process.env.AGENT_ADMIN_PORT);
            // @tothink http/https?  should this be from the env?
            agentUrl = `http://${agentId}:${adminPort}`;
        }

        // Logic for token - eventually this will all be handled by ICaller
        const token = profile ? profile.token : null;

        return await HandlersFactory.getHandler(this.agentGovernance, topic, this.http, this.cache)
            .handleAcapyWebhookMsg(agentUrl, agentId, adminApiKey, route, topic, body, token);
    }
}

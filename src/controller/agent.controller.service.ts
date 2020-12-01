import { Injectable, HttpService, Inject, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { AgentGovernance } from './agent.governance';
import { HandlersFactory } from './handler/handlers.factory';

/**
 * Handler for ACAPY "webhook" endpoints, which allows agents to automatically respond to agent messages
 * according to the governance policy setup.  See [../config/governance.json] for configurations.
 */
@Injectable()
export class AgentControllerService {

    private readonly http: ProtocolHttpService;

    constructor(
        httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance) {
        this.http = new ProtocolHttpService(httpService);
    }

    async handleRequest(route: string, topic: string, body: any) {
        const agentId: string = process.env.AGENT_ID || 'agent';
        const agent: any = await this.cache.get(agentId);
        let adminApiKey = process.env.ADMIN_API_KEY;

        // Sometimes the agent controller is used for a single agent and other times it serves in an agency
        // capacity.  Because of this, adminApiKey may not be cached so we have to check env when its not in
        // cache and we will error if environment isn't setup correctly.
        if (!adminApiKey && agent) {
            adminApiKey = agent.adminApiKey;
        }
        if (!adminApiKey) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_NODE_ENVIRONMENT, 'admin api key is missing from environment');
        }
        const adminPort = (agent ? agent.adminApiPort : process.env.AGENT_ADMIN_PORT);
        // @tothink http/https?  should this be from the env?
        const agentUrl = `http://${agentId}:${adminPort}`;

        return await HandlersFactory.getHandler(this.agentGovernance, topic, this.http, this.cache)
            .handlePost(agentUrl, agentId, adminApiKey, route, topic, body);

    }
}

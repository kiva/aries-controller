import { Injectable, HttpService, Inject, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AgentGovernance } from './agent.governance';
import { HandlersFactory } from './handler/handlers.factory';

/**
 * TODO this needs to handle general requests that come from the agents for the controller to handle -
 * it should have some way of checking what it's behavior should be and respond accordingly
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
        const adminPort = (agent ? agent.adminApiPort : process.env.AGENT_ADMIN_PORT);
        // @tothink http/https?  should this be from the env?
        const agentUrl = `http://${agentId}:${adminPort}`;

        return await HandlersFactory.getHandler(this.agentGovernance, topic, this.http, this.cache)
            .handlePost(agentUrl, agentId, agent.adminApiKey, route, topic, body);

    }
}

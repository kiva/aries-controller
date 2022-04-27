import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from 'protocol-common';
import { AgentControllerService } from './agent.controller.service.js';

/**
 * TODO will change the name to webhook in this ticket: https://kiva.atlassian.net/browse/PRO-3014
 * This handles all the webhook responses from our aca-py agents to this controller
 * They will always be POST and alway contain a body
 * Every webhook will have 3 components:
 *   agentId: this is useful for multi-controllers like the agency to determine which agent it's replying to
 *   route: is always 'topic' so isn't very useful
 *   subroute: is the specific topic for this webhook, eg connections, issue_credential, etc
 * TODO eventually we can strip out route since it's always topic and not useful
 */
@Controller('v1/controller')
@ApiTags('controller')
export class AgentControllerController {

    constructor(private readonly agentControllerService: AgentControllerService) {}

    // TODO eventually I'd like the agentId to be extracted from the params and put onto the header (or something) so it can be used later on
    //      but wait how will that work in prod where we need the auth0 token?

    /**
     * This is the webhook url that aca-py will send to. Note there's no way to instruct aca-py to put the agentId in a header or anything,
     * thus we rely on the url path to provide which agent id it wants this controller to control
     */
    @Post(':agentId/:route/:subroute')
    async postController(
        @Param('agentId') agentId: string,
        @Param('route') route: string,
        @Param('subroute') subroute: string,
        @Body() body: any
    ): Promise<any> {
        Logger.debug('----- POST WEB HOOK START -----');
        Logger.debug(`${route}/${subroute}`, body);
        return await this.agentControllerService.handleRequest(agentId, route, subroute, body);
    }

}

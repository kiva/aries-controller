import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentService } from './agent.service';

/**
 * General calls to make to an agent
 */
@Controller('v1/agent')
@ApiTags('agent')
export class AgentController {

    constructor(private readonly agentService: AgentService) {}

    /**
     * Opens a connection and returns the invitation connection data
     */
    @Post('init')
    public async init(): Promise<any> {
        return await this.agentService.init();
    }

    /**
     * Opens a connection and returns the invitation connection data
     */
    @Post('connection')
    public async openConnection(): Promise<any> {
        return await this.agentService.openConnection();
    }

    /**
     * Check status of connection
     */
    @Get('connection/:connectionId')
    async checkConnection(@Param('connectionId') connectionId: string): Promise<any> {
        return await this.agentService.checkConnection(connectionId);
    }

    /**
     * Accepts a connection via the invitation on the body
     */
    @Post('accept-connection')
    public async acceptConnection(@Body() body: any): Promise<any> {
        return await this.agentService.acceptConnection(body.alias, body.invitation);
    }

    /**
     * Publicizes a DID that already stored in the agent's wallet
     */
    @Post('publicize-did')
    public async publicizeDid(@Body() body: any): Promise<any> {
        return await this.agentService.publicizeDid(body.did);
    }

    // TODO putting these here for now but will eventually move somewhere else

    @Post('controller')
    public async registerController(@Body() body: any): Promise<any> {
        return await this.agentService.registerController(body);
    }
}

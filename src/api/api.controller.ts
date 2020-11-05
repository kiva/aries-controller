import { Get, Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentService } from '../agent/agent.service';
import { IssuerService } from '../issuer/issuer.service';
import { VerifierService } from '../verifier/verifier.service';

/**
 * Contains API routes that we want exposed to the front end
 */
@Controller('v2/api')
@ApiTags('api')
@Controller()
export class ApiController {

    /**
     * Depends on multiple services
     */
    constructor(
        private readonly agentService: AgentService,
        private readonly issuerService: IssuerService,
        private readonly verifierService: VerifierService,
    ) {}

    /**
     * Create connection for mobile agent to receive
     */
    @Post('connection')
    async createConnection(): Promise<any> {
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
     * Issue credential to connection
     * Expects: profile, connectionId, entityData
     */
    @Post('issue')
    async registerMobile(@Body() body: any): Promise<any> {
        return await this.issuerService.issueCredential(body.profile, body.connectionId, body.entityData);
    }


    /**
     * Check status of credential being issued
     */
    @Get('issue/:credentialExchangeId')
    async checkCredential(@Param('credentialExchangeId') credentialExchangeId: string): Promise<any> {
        return await this.issuerService.checkCredentialExchange(credentialExchangeId);
    }

    /**
     * Initiate proof exchange
     * Expects profile, connectionId
     */
    @Post('verify')
    public async verify(@Body() body: any): Promise<any> {
        return await this.verifierService.verify(body.profile, body.connectionId);
    }

    /**
     * Check status of presentation exchange
     */
    @Get('verify/:presExId')
    async checkPresEx(@Param('presExId') presExId: string): Promise<any> {
        return await this.verifierService.checkPresEx(presExId);
    }

    /**
     * Onboards an entity into the guardian system and issues them a credential
     * Expects: profile, guardianData, entityData
     */
    @Post('guardian/onboard')
    public async onboardEntity(@Body() body: any): Promise<any> {
        return await this.issuerService.onboardEntity(body.profile, body.guardianData, body.entityData);
    }

    /**
     * Verify using the key guardian
     * Expects profile, guardianData
     */
    @Post('guardian/verify')
    public async escrowVerify(@Body() body: any): Promise<any> {
        // TODO eventually we should update all references and reverse the order here
        return await this.verifierService.escrowVerify(body.guardianData, body.profile);
    }
}

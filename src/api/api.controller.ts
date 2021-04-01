import { Get, Controller, Post, Param, Body, Delete } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProtocolValidationPipe } from 'protocol-common/protocol.validation.pipe';
import { Services } from '../utility/services';
import { AgentService } from '../agent/agent.service';
import { IssuerService } from '../issuer/issuer.service';
import { VerifierService } from '../verifier/verifier.service';
import { ConnectionGetResDto } from './dtos/connection.get.res.dto';
import { ConnectionPostResDto } from './dtos/connection.post.res.dto';
import { GuardianOnboardPostReqDto } from './dtos/guardian.onboard.post.req.dto';
import { GuardianOnboardPostResDto } from './dtos/guardian.onboard.post.res.dto';
import { GuardianVerifyPostReqDto } from './dtos/guardian.verify.post.req.dto';
import { IssuePostReqDto } from './dtos/issue.post.req.dto';
import { IssuePostResDto } from './dtos/issue.post.res.dto';
import { IssueDeleteResDto} from './dtos/issue.delete.res.dto';
import { VerifyGetResDto } from './dtos/verify.get.res.dto';
import { VerifyPostReqDto } from './dtos/verify.post.req.dto';
import { VerifyPostResDto } from './dtos/verify.post.res.dto';
import { GuardianIssuePostReqDto } from './dtos/guardian.issue.post.req.dto';
import { GuardianEnrollPostReqDto } from './dtos/guardian.enroll.post.req.dto';
import { GuardianEnrollPostResDto } from './dtos/guardian.enroll.post.res.dto';

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
    @ApiResponse({ status: 201, type: ConnectionPostResDto })
    @Post('connection')
    async createConnection(): Promise<ConnectionPostResDto> {
        return await this.agentService.openConnection();
    }

    /**
     * Check status of connection
     */
    @ApiResponse({ status: 200, type: ConnectionGetResDto })
    @Get('connection/:connectionId')
    async checkConnection(@Param('connectionId') connectionId: string): Promise<ConnectionGetResDto> {
        return await this.agentService.checkConnection(connectionId);
    }

    /**
     * Issue credential to connection
     * Expects: profile, connectionId, entityData
     */
    @ApiResponse({ status: 201, type: IssuePostResDto })
    @Post('issue')
    async issueCredential(@Body(new ProtocolValidationPipe()) body: IssuePostReqDto): Promise<IssuePostResDto> {
        return await this.issuerService.issueCredential(body.profile, body.connectionId, body.entityData);
    }

    /**
     * Check status of credential being issued
     */
    @ApiResponse({ status: 200, type: IssuePostResDto })
    @Get('issue/:credentialExchangeId')
    async checkCredential(@Param('credentialExchangeId') credentialExchangeId: string): Promise<IssuePostResDto> {
        return await this.issuerService.checkCredentialExchange(credentialExchangeId);
    }

    /**
     * Initiate proof exchange
     * Expects profile, connectionId
     */
    @ApiResponse({ status: 201, type: VerifyPostResDto })
    @Post('verify')
    public async verify(@Body(new ProtocolValidationPipe()) body: VerifyPostReqDto): Promise<VerifyPostResDto> {
        return await this.verifierService.verify(body.profile, body.connectionId);
    }

    /**
     * Check status of presentation exchange
     */
    @ApiResponse({ status: 200, type: VerifyGetResDto })
    @Get('verify/:presExId')
    async checkPresEx(@Param('presExId') presExId: string): Promise<VerifyGetResDto> {
        return await this.verifierService.checkPresEx(presExId);
    }

    /**
     * Enrolls in the key guardian without issuing a credential
     * Expects an array of guardian data, and returns connection data
     */
    @ApiResponse({ status: 201, type: GuardianEnrollPostResDto })
    @Post('guardian/enroll')
    public async guardianEnroll(@Body(new ProtocolValidationPipe()) body: GuardianEnrollPostReqDto): Promise<GuardianEnrollPostResDto> {
        return await this.issuerService.enrollInKeyGuardian(body.guardianData);
    }

    /**
     * Issues a credential to an entity in guardianship
     * Expects: profile, guardianData, entityData
     */
    @ApiResponse({ status: 201, type: GuardianOnboardPostResDto })
    @Post('guardian/issue')
    public async guardianIssue(@Body(new ProtocolValidationPipe()) body: GuardianIssuePostReqDto): Promise<GuardianOnboardPostResDto> {
        return await this.issuerService.issueInGuardianship(body.profile, body.guardianVerifyData, body.entityData);
    }

    /**
     * Onboards an entity into the guardian system and issues them a credential
     * Expects: profile, guardianData, entityData
     */
    @ApiResponse({ status: 201, type: GuardianOnboardPostResDto })
    @Post('guardian/onboard')
    public async onboardEntity(@Body(new ProtocolValidationPipe()) body: GuardianOnboardPostReqDto): Promise<GuardianOnboardPostResDto> {
        return await this.issuerService.onboardEntity(body.profile, body.guardianData, body.entityData);
    }

    /**
     * Verify using the key guardian
     * Expects profile, guardianData
     */
    @Post('guardian/verify')
    public async escrowVerify(@Body(new ProtocolValidationPipe()) body: GuardianVerifyPostReqDto): Promise<any> {
        // TODO eventually we should update all references and reverse the order here
        return await this.verifierService.escrowVerify(body.guardianData, body.profile);
    }

    /**
     * Returns all profiles indexed by profile name
     */
    @Get('profiles')
    public getProfiles(): any {
        return Services.getAllProfiles();
    }

    /**
     * Gets all issued credential records
     */
    @Get('records')
    public async getRecords(): Promise<any> {
        return await this.issuerService.getAllRecords();
    }

    /**
     * Creates a credential definition with revocation passed on the passed in data
     */
    @Post('revoke')
    public async revoke(@Body() body: any): Promise<any> {
        return await this.issuerService.revokeCredential(body.credential_exchange_id, body.publish);
    }

    /**
     * Deletes a credential for the issuer
     */
    @ApiResponse({ status: 200, type: IssueDeleteResDto })
    @Delete('issuer/records/:credExId}')
    async issuerDeleteCredential(@Param('credExId') credExId: string): Promise<VerifyGetResDto> {
        return await this.issuerService.deleteCredential(credExId);
    }

    /**
     * Deletes a credential for the holder
     */
     @ApiResponse({ status: 200, type: IssueDeleteResDto })
     @Delete('holder/records/:credId}')
     async holderDeleteCredential(@Param('credExId') credExId: string): Promise<VerifyGetResDto> {
         return await this.agentService.deleteCredential(credExId);
     }
}

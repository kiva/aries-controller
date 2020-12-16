import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IssuerService } from './issuer.service';

/**
 * Endpoints related to the issuer's role
 */
@Controller('v1/issuer')
@ApiTags('issuer')
export class IssuerController {

    constructor(private readonly issuerService: IssuerService) {}

    /**
     * Creates a credential definition passed on the passed in data
     * @tothink we could restrict this just to profiles saved on the controller
     */
    @Post('cred-def')
    public async createCredDef(@Body() body: any): Promise<any> {
        return await this.issuerService.createCredDef(body.schema_id, body.tag, body.support_revocation);
    }

    @Post('revocation-registry')
    public async createRevReg(@Body() body: any): Promise<any> {
        return await this.issuerService.createCredDef(body.schema_id, body.tag, true);
    }

    /**
     * Issues a credential to the given connection id, using the given cred def profile, with the entityData in regular dictionary form
     * This can be used to issue directly to a mobile device
     */
    @Post('issue')
    public async issueCredential(@Body() body: any): Promise<any> {
        return await this.issuerService.issueCredential(body.credDefProfile, body.connectionId, body.entityData);
    }

    /**
     * Check status of credential being issued, useful for mobile issuance
     */
    @Get('issue/:credentialExchangeId')
    async checkCredential(@Param('credentialExchangeId') credentialExchangeId: string): Promise<any> {
        return await this.issuerService.checkCredentialExchange(credentialExchangeId);
    }

    /**
     * Issues a credential to the given connection id, using the passed in cred def data, with the attributes in the Aries format
     */
    @Post('issue-raw')
    public async issueCredentialRaw(@Body() body: any): Promise<any> {
        return await this.issuerService.issueCredentialSend(body.credentialData, body.connectionId, body.attributes);
    }

    /**
     * Onboards an entity into the guardian system and issues them a credential
     * Expects the cred def profile path, specifically formatted guardian data (an array of authentication methods), and attributes in Aries format
     */
    @Post('onboard')
    public async onboardEntity(@Body() body: any): Promise<any> {
        return await this.issuerService.onboardEntity(body.credDefProfile, body.guardianData, body.entityData);
    }
}

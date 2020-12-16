import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IssuerService } from './issuer.service';

/**
 * Endpoints related to the issuer's role
 * These are just the internal issuer endpoints, the public endpoints are exposed via ApiController
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
}

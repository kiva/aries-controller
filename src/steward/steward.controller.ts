import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StewardService } from './steward.service';

/**
 * Endpoints to support the steward role
 */
@Controller('v1/steward')
@ApiTags('steward')
export class StewardController {

    constructor(private readonly stewardService: StewardService) {}

    @Post('schema')
    public async createSchema(@Body() body: any): Promise<any> {
        return await this.stewardService.createSchema(body.schema_name, body.schema_version, body.attributes);
    }

    @Post('endorser')
    public async onboardEndorser(@Body() body: any): Promise<any> {
        return await this.stewardService.onboardEndorser(body.did, body.verkey, body.alias);
    }
}

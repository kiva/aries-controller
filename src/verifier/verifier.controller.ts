import { Controller, Body, Post, Param, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerifierService } from './verifier.service';

/**
 * Routes to support the verifier role
 */
@Controller('v1/verifier')
@ApiTags('verifier')
export class VerifierController {

    constructor(private readonly verifierService: VerifierService) {}

    /**
     * Verify using the given proof path and connection id
     * Useful for mobile verifications
     */
    @Post('verify')
    public async verify(@Body() body: any): Promise<any> {
        return await this.verifierService.verify(body.proof_profile_path, body.connection_id);
    }

    /**
     * Check status of presentation exchange
     * Useful for mobile verifications
     */
    @Get('verify/:presExId')
    async checkPresEx(@Param('presExId') presExId: string): Promise<any> {
        return await this.verifierService.checkPresEx(presExId);
    }

    /**
     * Verify using the escrow service
     * TODO body.data should become the DTO that's the same as the one passed to the key guardian,
     *      perhaps our key guardian facade should expose it's DTOs somehow
     */
    @Post('escrow-verify')
    public async escrowVerify(@Body() body: any): Promise<any> {
        return await this.verifierService.escrowVerify(body.data, body.proof_profile_path);
    }

}

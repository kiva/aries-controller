import { Controller, Body, Post, Param, Get, Ip, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerifierService } from './verifier.service.js';

/**
 * Routes to support the verifier role
 */
@Controller('v1/verifier')
@ApiTags('verifier')
export class VerifierController {

    private rate_limit_list: { ip: string; count: number }[] = [];
    private list_created_at: Date = new Date();

    constructor(private readonly verifierService: VerifierService) {}

    private checkAndLogIp(ipAddress: string): void {
        // step 1: we are interested in the number of requests over time.  so
        // check how long its been since we started collecting Ips and reset the list
        // if the time span has been exceeded.
        const timeSpan: number = (new Date().getTime() - this.list_created_at.getTime()) / 1000;
        if (timeSpan > (process.env.RATE_LIMIT_TIME_SPAN_SECS || 30)) {
            this.list_created_at = new Date();
            this.rate_limit_list = [];
        }

        // step 2: collect count for this ip address.
        const index: number = this.rate_limit_list.findIndex(e => e.ip === ipAddress);
        if (-1 === index) {
            this.rate_limit_list.push({ip: ipAddress, count: 1});
            return;
        }
        const count = this.rate_limit_list[index].count + 1;
        this.rate_limit_list[index] = {ip: ipAddress, count};

        // step 3: record if IP address requests exceed expected limit
        if (count > (process.env.RATE_LIMIT || 10)) {
            Logger.warn('ip address requests exceeding set limit');
        }
    }

    /**
     * Verify using the given proof path and connection id
     * Useful for mobile verifications
     */
    @Post('verify')
    public async verify(@Ip() ipAddress: string, @Body() body: any): Promise<any> {
        this.checkAndLogIp(ipAddress);
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

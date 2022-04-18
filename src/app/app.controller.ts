import { Get, Controller } from '@nestjs/common';
import { HttpConstants } from 'protocol-common/http-context/http.constants';
import { DisableAutoLogging } from 'protocol-common/disable.auto.logging.decorator';
import { ServiceReportDto } from './dtos/service.report.dto';
import { AppService } from './app.service';

/**
 * Base route is for various health check endpoints
 */
@DisableAutoLogging()
@Controller()
export class AppController {

    constructor(private readonly service: AppService) {
    }

    @Get()
    base(): string {
        return process.env.SERVICE_NAME;
    }

    @Get('ping')
    ping(): string {
        return HttpConstants.PING_RESPONSE;
    }

    @Get('healthz')
    healthz(): string {
        return HttpConstants.HEALTHZ_RESPONSE;
    }

    /**
     * Called by the protocol-services-support service
     * for uptime statistics reporting "engine".
     */
    @Get('stats')
    generateStatsReport() : ServiceReportDto {
        return this.service.generateStatsReport();
    }

}

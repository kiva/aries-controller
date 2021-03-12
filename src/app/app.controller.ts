import { Get, Controller } from '@nestjs/common';
import { HttpConstants } from 'protocol-common/http-context/http.constants';
import { DisableAutoLogging } from 'protocol-common/disable.auto.logging.decorator';

/**
 * Base route is for various health check endpoints
 */
@DisableAutoLogging()
@Controller()
export class AppController {

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
}

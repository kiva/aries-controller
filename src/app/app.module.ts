import { Module } from '@nestjs/common';
import { ConfigModule, LoggingInterceptor, ProtocolLoggerModule } from 'protocol-common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { AgentModule } from '../agent/agent.module.js';
import { AgentControllerModule } from '../controller/agent.controller.module.js';
import { IssuerModule } from '../issuer/issuer.module.js';
import { StewardModule } from '../steward/steward.module.js';
import { VerifierModule } from '../verifier/verifier.module.js';
import { ApiModule } from '../api/api.module.js';

// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import data from '../config/env.json' assert { type: 'json'};


/**
 * Base modules for a controller
 */
@Module({
    imports: [
        ConfigModule.init(data),
        ProtocolLoggerModule,
        AgentModule,
        AgentControllerModule,
        IssuerModule,
        StewardModule,
        VerifierModule,
        ApiModule,
    ],
    controllers: [AppController],
    providers: [
      AppService,
      {
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor
      },
    ],
    exports: []
})
export class AppModule {}

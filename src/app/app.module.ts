import { Module } from '@nestjs/common';
import { ConfigModule } from 'protocol-common/config.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import data from '../config/env.json';
import { AgentModule } from '../agent/agent.module';
import { AgentControllerModule } from '../controller/agent.controller.module';
import { IssuerModule } from '../issuer/issuer.module';
import { StewardModule } from '../steward/steward.module';
import { VerifierModule } from '../verifier/verifier.module';
import { ApiModule } from '../api/api.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'protocol-common/logging.interceptor';
import { AgentService } from 'agent/agent.service';
import { CallerModule } from 'caller/caller.module';
import { ControllerHandlerModule } from 'controller.handler/controller.handler.module';

/**
 * Base modules for a controller
 */
@Module({
    imports: [
        ConfigModule.init(data),
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

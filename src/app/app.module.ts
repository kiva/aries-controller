import { Module } from '@nestjs/common';
import { ConfigModule } from 'protocol-common/config.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import data from '../config/env.json';
import { AgentModule } from '../agent/agent.module';
import { AgentControllerModule } from '../controller/agent.controller.module';
import { ImplementationModule } from '../implementation/implementation.module';
import { IssuerModule } from '../issuer/issuer.module';
import { StewardModule } from '../steward/steward.module';
import { VerifierModule } from '../verifier/verifier.module';
import { ApiModule } from '../api/api.module';

/**
 * If an implementation module has been defined import it
 */
const implementationModule = ImplementationModule.register(process.env.IMPLEMENTATION_MODULE_PATH, process.env.IMPLEMENTATION_MODULE_NAME);
@Module({
    imports: [
        ConfigModule.init(data),
        AgentModule,
        AgentControllerModule,
        IssuerModule,
        StewardModule,
        VerifierModule,
        ApiModule,
        ... implementationModule ? [implementationModule] : []
    ],
    controllers: [AppController],
    providers: [AppService],
    exports: []
})
export class AppModule {}

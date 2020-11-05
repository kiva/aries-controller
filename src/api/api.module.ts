import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { AgentModule } from '../agent/agent.module';
import { IssuerModule } from '../issuer/issuer.module';
import { VerifierModule } from '../verifier/verifier.module';

/**
 * The API module is a convenient way to map the endpoints that we want exposed to the frontend
 */
@Module({
    imports: [
        AgentModule,
        IssuerModule,
        VerifierModule
    ],
    controllers: [ApiController],
    providers: []
})
export class ApiModule {}

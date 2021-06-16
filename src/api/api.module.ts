import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { AgentModule } from '../agent/agent.module';
import { IssuerModule } from '../issuer/issuer.module';
import { VerifierModule } from '../verifier/verifier.module';
import { AgentContext } from '../utility/agent.context';
import { ProfileModule } from '../profile/profile.module';

/**
 * The API module is a convenient way to map the endpoints that we want exposed to the frontend
 */
@Module({
    imports: [
        AgentModule,
        IssuerModule,
        VerifierModule,
        ProfileModule,
    ],
    controllers: [ApiController],
    providers: [AgentContext]
})
export class ApiModule {}

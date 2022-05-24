import { Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';
import { AgentModule } from '../agent/agent.module.js';
import { IssuerModule } from '../issuer/issuer.module.js';
import { VerifierModule } from '../verifier/verifier.module.js';
import { AgentContext } from '../utility/agent.context.js';
import { ProfileModule } from '../profile/profile.module.js';

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

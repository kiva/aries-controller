import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { AgentContext } from '../utility/agent.context';

/**
 * This guard ensures that the "agent" on the token matches the configured agentId (eg kiva)
 * The gateway has already verified the jwt so we just need to decode and extract metadata
 */
@Injectable()
export class AgentGuard implements CanActivate {
    constructor(
        protected readonly agentContext: AgentContext
    ) {}

    /**
     * We only active is there's a valid auth header and it's metadata matches the configured agent
     * We add lots of debug messages to help us figure out what when wrong if things fail
     */
    canActivate(context: ExecutionContext): boolean {
        if (process.env.AGENT_GUARD_ENABLED === 'false') {
            Logger.debug('AgentGuard: Allowing user since guard is disabled');
            return true;
        }

        if (!process.env.AGENT_ID) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_CONFIGURATION, 'Must configure agent for this controller');
        }

        const req = context.switchToHttp().getRequest();

        const agentId = this.agentContext.getAgentId((process.env.AGENT_GUARD_ENABLED === 'true'));

        if (agentId !== process.env.AGENT_ID) {
            throw new ProtocolException(ProtocolErrorCode.FORBIDDEN_EXCEPTION, 'AgentGuard: agent doesn\'t match configured agent', null, 403);
        }

        return true;
    }
}

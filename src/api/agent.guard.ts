import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { AgentContext } from '../utility/agent.context';

/**
 * For single controllers we ensure the that the agent on the token matches the configured agentId (eg kiva)
 * For multi controllers we just ensure that the token has a valid agent (since there is no configured agents)
 */
@Injectable()
export class AgentGuard implements CanActivate {
    constructor(
        protected readonly agentContext: AgentContext,
    ) {}

    /**
     * The validation of the agent metadata on the token takes place in AgentContext
     * This guard just ensures that for single controllers it matches the configured value
     */
    canActivate(context: ExecutionContext): boolean {
        const guardEnabled = !(process.env.AGENT_GUARD_ENABLED === 'false');
        if (!guardEnabled) {
            Logger.debug('AgentGuard: Allowing request since guard is disabled');
            return true;
        }

        const agentId = this.agentContext.getAgentId(guardEnabled);

        if (process.env.MULTI_CONTROLLER !== 'true' && agentId !== process.env.AGENT_ID) {
            throw new ProtocolException(ProtocolErrorCode.FORBIDDEN_EXCEPTION, 'AgentGuard: agent doesn\'t match configured agent for single controller', null, 403);
        }

        return true;
    }
}

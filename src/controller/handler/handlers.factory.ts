import { CacheStore } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { Logger } from 'protocol-common/logger';
import { IAgentResponseHandler } from './agent.response.handler';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Connections } from './connections';
import { AgentGovernance } from '../agent.governance';
import { Proofs } from './proof';
import { IssueCredential } from './issue.credential';
import { ProblemReport } from './problem.report';
import { DoNothing } from './do.nothing';
import { BasicMessage } from './basic.message';
import { Topics } from './topics';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

/*
    @TODO we want to replace this factory with nestjs injection at some point
 */
export class HandlersFactory {
    /**
     * Factory method that examines 'topic' input and finds an appropriate handler. returns implementation of
     * IAgentResponseHandler
     *
     * @param agentGovernance
     * @param topic
     * @param http
     * @param cache
     */
    public static getHandler(agentGovernance: AgentGovernance, topic: string, http: ProtocolHttpService, cache: CacheStore): IAgentResponseHandler {
        switch (topic) {
            case Topics.CONNECTIONS:
                return new Connections(agentGovernance, http, cache);
            case Topics.PRESENT_PROOF:
                return new Proofs(agentGovernance, http, cache);
            case Topics.ISSUE_CREDENTIAL:
                return new IssueCredential(agentGovernance, http, cache);
            case Topics.PROBLEM_REPORT:
                return new ProblemReport(agentGovernance, http, cache);
            case Topics.BASIC_MESSAGES:
                return new BasicMessage(agentGovernance, http, cache);
            case Topics.REVOCATION_REGISTRY:
            case Topics.ISSUE_CRED_REV:
                return new DoNothing(agentGovernance, http, cache);
            default:
                Logger.debug(`unhandled topic ${topic}`);
                break;
        }
        throw new ProtocolException(ProtocolErrorCode.AGENCY_GOVERNANCE, `No suitable handler found for topic ${topic}`);
    }
}

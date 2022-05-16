import { CacheStore, Logger } from '@nestjs/common';
import { ProtocolException,ProtocolErrorCode, ProtocolHttpService } from 'protocol-common';
import { IAgentResponseHandler } from './agent.response.handler.js';
import { Connections } from './connections.js';
import { AgentGovernance } from '../agent.governance.js';
import { Proofs } from './proof.js';
import { IssueCredential } from './issue.credential.js';
import { ProblemReport } from './problem.report.js';
import { DoNothing } from './do.nothing.js';
import { BasicMessage } from './basic.message.js';
import { Topics } from './topics.js';

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

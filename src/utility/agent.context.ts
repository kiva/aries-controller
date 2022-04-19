import { Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

/**
 * To authenticate with a given agent there needs to be an agentId specified
 * Locally for testing this can be set with an 'agent' header
 * In our remote envs there should be an 'agent' attribute in the JWT metadata
 */
export class AgentContext {

    constructor(
        @Inject(REQUEST) protected readonly req: Request,
    ) { }

    private static forbiddenException(msg: string) {
        return new ProtocolException(ProtocolErrorCode.FORBIDDEN_EXCEPTION, msg, null, 403);
    }

    /**
     * An environment variable can be passed in to either pull the agentId from the auth header (for remote)
     * or from a test header called 'agent' (for local testing)
     */
    public getAgentId(guardEnabled = true): string {
        if (guardEnabled) {
            return this.getAgentIdFromAuth();
        }
        return this.getAgentIdFromLocalHeader();
    }

    /**
     * Parses the JWT to extract the agent value from the metadata
     * Note that the JWT has already been validated by the gateway
     */
    public getAgentIdFromAuth(): string {
        const authHeader = this.req.headers.authorization;
        if (!authHeader) {
            throw AgentContext.forbiddenException('AgentContext: No auth header');
        }

        const token = authHeader.slice(7, authHeader.length);
        if (!token) {
            throw AgentContext.forbiddenException( 'AgentContext: No token in auth header');
        }

        let metaData;
        try {
            metaData = jwt.decode(token);
            if (!metaData) {
                throw new Error();
            }
        } catch (e) {
            throw AgentContext.forbiddenException('AgentContext: Failed to decode JWT');
        }

        // Custom claims on a OIDC-compliant requires a URI namespace, for generic protocol metadata in Auth0 we use https://protocol.kiva.org/
        const agentId: string = metaData['https://protocol.kiva.org/agent'];
        if (!agentId) {
            throw AgentContext.forbiddenException('AgentContext: No agent attribute in token metadata');
        }

        return agentId;
    }

    /**
     * For local testing, instead of needing a JWT you can just pass the agentId through the 'agent' header
     */
    public getAgentIdFromLocalHeader(): string {
        const agentHeader: string | string[] = this.req.headers.agent;
        if (!agentHeader) {
            throw AgentContext.forbiddenException('AgentContext: No agent header');
        }
        if (Array.isArray(agentHeader)) {
            throw AgentContext.forbiddenException('AgentContext: Agent header can only have 1 value');
        }
        return agentHeader;
    }
}

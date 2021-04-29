import { Injectable, CacheStore, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

/**
 *
 */
@Injectable()
export class MultiControllerHandler {

    /**
     *
     */
    constructor(
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
        @Inject(REQUEST) private readonly req: Request,
    ) { }

    /**
     * Loads the values to use for the multi controller
     *
     */
    public async loadValues(): Promise<any> {
        const agentId = this.handleAgentId();

        // TODO fetch from DB
        const profile: any = await this.cache.get('profile_' + agentId);

        if (!profile) {
            throw new ProtocolException('NotRegistered', `No profile found for ${agentId}, need to register first`);
        }

        return {
            agentId,
            walletId: profile.walletId,
            walletKey: profile.walletKey,
            label: profile.label,
            controllerUrl: profile.controllerUrl,
            adminApiKey: process.env.ADMIN_API_KEY,
            // below are just needed for single agents
            seed: profile.seed,
            useTailsServer: profile.useTailsServer,
        };
    }

    public handleAgentId(): string {
        // TODO change name to AgentId gaurd?
        if (process.env.INSTITUTION_GUARD_ENABLED === 'false') {
            Logger.debug('Allowing user since institution guard is disabled');
            return this.getFromAgentHeader();
        }

        // Check Auth0 and pull from there
        return this.getFromAuthHeader();
    }

    /**
     * This is just used for local testing
     */
     private getFromAgentHeader(): string {
        const agentHeader = this.req.headers.agent;
        if (!agentHeader) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: No agent header', null, 403);
        }
        return agentHeader;
    }

    /**
     * This relies on metadata from auth 0
     * TODO move to base class
     */
    private getFromAuthHeader(): string {
        const authHeader = this.req.headers.authorization;
        if (!authHeader) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: No auth header', null, 403);
        }

        const token = authHeader.slice(7, authHeader.length);
        if (!token) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: No token in auth header', null, 403);
        }

        let metaData;
        try {
            metaData = jwt.decode(token);
            if (!metaData) {
                throw new Error();
            }
        } catch (e) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: Failed to decode JWT', null, 403);
        }

        const institution: string = metaData['https://ekyc.sl.kiva.org/institution'];
        if (!institution) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: No institution in token metadata', null, 403);
        }
        return institution.toLowerCase();
    }
}

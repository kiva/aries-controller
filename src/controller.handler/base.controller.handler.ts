import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProfileManager } from '../profile/profile.manager';

/**
 * Base class for both single and multi controller handlers
 */
@Injectable()
export class BaseControllerHandler {

    constructor(
        protected readonly profileManager: ProfileManager,
        @Inject(REQUEST) protected readonly req: Request,
    ) { }

    /**
     * TODO filed https://kiva.atlassian.net/browse/PRO-3011 for additional refactors
     * This relies on metadata from Auth0 and only gets called in envs where it's enabled
     * Note that in Auth0 we reference "institution"
     */
     protected getFromAuthHeader(): string {
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

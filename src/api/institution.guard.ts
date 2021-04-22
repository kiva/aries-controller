import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Logger } from 'protocol-common/logger';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolException } from 'protocol-common/protocol.exception';

/**
 * This guard ensures that the "institution" on the token matches the configured institution (eg kiva)
 * The gateway has already verified the jwt so we just need to decode and extract metadata
 */
@Injectable()
export class InstitutionGuard implements CanActivate {
    constructor() {}

    /**
     * We only active is there's a valid auth header and it's metadata matches the configured institution
     * We add lots of debug messages to help us figure out what when wrong if things fail
     */
    canActivate(context: ExecutionContext): boolean {
        if (!process.env.INSTITUTION) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_CONFIGURATION, 'Must configure institution for this controller');
        }

        if (process.env.INSTITUTION_GUARD_ENABLED !== 'false') {
            Logger.debug('Allowing user since institution guard is disabled');
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers.authorization;
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
            Logger.log(metaData);
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

        if (process.env.ALLOW_ADMIN_INSTITUTION === 'true' && institution.toLowerCase() === 'admin') {
            Logger.debug('Allowing admin user');
            return true;
        }

        // Lower case comparison to avoid false negatives
        if (institution.toLowerCase() !== process.env.INSTITUTION.toLowerCase()) {
            throw new ProtocolException('ForbiddenException', 'InstitutionGuard: institution doesn\'t match configured institution', null, 403);
        }
        return true;
    }
}
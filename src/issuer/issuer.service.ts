import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { AgentService } from '../agent/agent.service';
import { Services } from '../utility/services';
import { CALLER, ICaller } from '../caller/caller.interface';
import { IControllerHandler, CONTROLLER_HANDLER } from '../controller.handler/controller.handler.interface';
import { Validator } from 'jsonschema';
import { ProfileManager } from '../profile/profile.manager';
import { SchemaCredDefReqDto } from '../api/dtos/schema.cred.def.req.dto';

/**
 * TODO it may be better to have the IssuerService extend the Agent/General Service rather than passing it in
 * TODO need to figure out rollbacks - ie if one part fails need to roll back any saved data
 * Note we're using jsonschema here instead of class-validator because even though class-validator says they support json schemas
 *      it doesn't currently work, and in their road map their planning to deprecate it.
 */
@Injectable()
export class IssuerService {

    private readonly http: ProtocolHttpService;

    private readonly validator: Validator;

    constructor(
        public readonly agentService: AgentService,
        @Inject(CALLER) private readonly agentCaller: ICaller,
        @Inject(CONTROLLER_HANDLER) private readonly controllerHandler: IControllerHandler,
        httpService: HttpService,
        private readonly profileManager: ProfileManager,
    ) {
        this.http = new ProtocolHttpService(httpService);
        this.validator = new Validator();
    }

    /**
     * Issue a credential to existing connection using a cred def profile path and some entity data which can be formatted to Aries attributes
     */
    public async issueCredential(credDefProfilePath: string, connectionId: string, entityData: any): Promise<any> {
        const [credentialData, credDefAttributes, validation] = await this.getCredDefAndSchemaData(credDefProfilePath);
        this.validateEntityData(validation, entityData);
        const attributes = this.formatEntityData(entityData, credDefAttributes);

        const ret = await this.issueCredentialSend(credentialData, connectionId, attributes);

        if (process.env.FLAG_RECORD_ISSUANCES === 'true') {
            await this.recordCredential(entityData, ret);
        }

        return ret;
    }

    /**
     * Record the issued credential using the external credential record service
     */
    public async recordCredential(entityData: any, issuanceRecord: any) {
        const url = process.env.CREDENTIAL_RECORD_URL;
        this.callService('POST', url, {
            entityData,
            connection_id: issuanceRecord.connection_id,
            schema_id: issuanceRecord.schema_id,
            credential_definition_id: issuanceRecord.credential_definition_id,
            credential_exchange_id: issuanceRecord.credential_exchange_id,
            state: issuanceRecord.state,
            created_at: issuanceRecord.created_at,
            thread_id: issuanceRecord.thread_id,
            updated_at: issuanceRecord.updated_at,
            credential_id: issuanceRecord.credential_id,
            revoc_reg_id: issuanceRecord.revoc_reg_id,
            institution: this.controllerHandler.handleAgentId(), // TODO change from institution to agentId in record-service
        });
    }

    /**
     * Call an external service / url
     */
    public async callService(method: any, url: string, data: any): Promise<any> {
        const req: AxiosRequestConfig = {
            method,
            url,
            data,
        };
        try {
            Logger.log(`Calling service ${url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        } catch (e) {
            Logger.warn(`Service call failed to ${url} with ${JSON.stringify(data)}`, e);
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, `Service call failed: ${e.message}`, { url, ex: e.details });
        }
    }

    /**
     * Full onboarding flow - enrolls entity in key guardian and issue credential
     */
    public async onboardEntity(credDefProfilePath: string, guardianData: Array<any>, entityData: any): Promise<any> {
        const keyGuardRes = await this.enrollInKeyGuardian(guardianData);
        Logger.log('1: Enrolled in Key Guardian');
        const connectionRes = await this.agentService.acceptConnection(keyGuardRes.id, keyGuardRes.connectionData);
        Logger.log('2: Connection invitation created');
        if (false === await Services.waitForAcceptedConnection(connectionRes.connection_id, this.agentCaller)) {
            throw new ProtocolException(ProtocolErrorCode.CONNECTION_NOT_READY, 'Connection was not accepted by newly created agent');
        }
        Logger.log('3: Connection accepted');
        const agentData = await this.issueCredentialAndWait(credDefProfilePath, connectionRes.connection_id, entityData);
        Logger.log('4: Credential Issued');
        return {
            agentId: keyGuardRes.id,
            agentData
        };
    }

    /**
     * Enrolls an entity in the key guardian which multiple authentication methods
     * Expects an array of data formatted for the key guardian
     */
    public async enrollInKeyGuardian(guardianData: Array<any>): Promise<any> {
        let id;
        let returnData;
        for (const guardianEntry of guardianData) {
            if (!id) {
                returnData = await this.createKeyGuardianEntry(guardianEntry);
                id = returnData.id;
            } else {
                await this.addKeyGuardianEntry(id, guardianEntry);
            }
        }
        return returnData;
    }

    /**
     * Given a previously enrolled entity, issues a credential after verifying with the key guardian
     */
    public async issueInGuardianship(credDefProfilePath: string, guardianVerifyData: any, entityData: any): Promise<any> {
        const keyGuardRes = await this.verifyWithKeyGuardian(guardianVerifyData);
        Logger.log('1. Verified with Key Guardian');
        if (!keyGuardRes.connectionData) {
            return keyGuardRes;
        }
        const connectionRes = await this.agentService.acceptConnection('alias', keyGuardRes.connectionData);
        Logger.log('2: Connection invitation created');
        if (false === await Services.waitForAcceptedConnection(connectionRes.connection_id, this.agentCaller)) {
            throw new ProtocolException(ProtocolErrorCode.CONNECTION_NOT_READY, 'Connection was not accepted by newly created agent');
        }
        Logger.log('3. Accepted connection invitation');
        const agentData = await this.issueCredentialAndWait(credDefProfilePath, connectionRes.connection_id, entityData);
        Logger.log('4: Credential Issued');
        return {
            agentId: keyGuardRes.id,
            agentData
        };
    }

    /**
     * Issues a credential and polls the exchange status until it's being accepted
     * There are 2 different cases depending on if auto_remove is set:
     *   if true then we poll until we get a 404 error that the credential has been removed (ie completed)
     *   if false we poll until we get a credential_acked state
     */
    public async issueCredentialAndWait(credDefProfilePath: string, connectionId: string, entityData: any): Promise<any> {
        const credSend = await this.issueCredential(credDefProfilePath, connectionId, entityData);
        const credExId = credSend.credential_exchange_id;

        let res = { state: 'not_started'};
        for (let i = 0; i < parseInt(process.env.PROOF_WAIT_SEC, 10); i++) {
            try {
                res = await this.checkCredentialExchange(credExId);
                if (res.state === 'credential_acked') {
                    Logger.log('Credential accepted');
                    return res;
                }
                await ProtocolUtility.delay(1000);
            } catch(e) {
                // If this issuer is set to auto remove then we expect a 404 message
                if (credSend.auto_remove && e.message && e.message.endsWith('404')) {
                    Logger.log('Credential accepted and deleted from issuers records');
                    return res;
                }
                throw new ProtocolException(ProtocolErrorCode.ISSUE_FAILED, 'Issuing process failed', e);
            }
        }
        throw new ProtocolException(ProtocolErrorCode.ISSUE_FAILED, 'Issuing process failed to complete', { state: res.state });
    }

    /**
     * Validates entity data against any validation schema provided in the cred def
     */
    private validateEntityData(entityData: any, validationSchema: any): Promise<void> {
        if (!validationSchema) {
            return;
        }

        const result = this.validator.validate(entityData, validationSchema);
        if (result.errors.length > 0) {
            throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Errors on schema validation', result.errors);
        }
    }

    /**
     * Formats entity data in the form of an object into a set of attributes that can be used by Aries, using the cred def attributes as a guide
     */
    private formatEntityData(entityData: any, credDefAttrs: Array<string>): Array<any> {
        const attributes = [];
        for (const key of credDefAttrs) {
            if (key.endsWith('~attach')) {
                attributes.push({
                    name: key,
                    value: entityData[key] || '',
                    'mime-type': 'text/plain'
                });
            } else {
                attributes.push({
                    name: key,
                    value: entityData[key] || '',
                });
            }
        }
        return attributes;
    }

    /**
     * The underlying indy protocol can't handle null attribute values, so we replace with empty strings
     */
    private sanitizeAttributes(attributes: Array<any>): Array<any> {
        for (const key of attributes.keys()) {
            if (attributes[key].value == null) {
                attributes[key].value = '';
            }
        }
        return attributes;
    }

    /**
     * TODO better error handling
     */
    private async getCredDefAndSchemaData(credDefProfilePath: string): Promise<any> {
        const credDefProfile = await this.profileManager.get(credDefProfilePath);
        if (!credDefProfile) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_PARAMS, `No stored profile for ${credDefProfilePath}`);
        }
        const attributes = credDefProfile.attributes;
        const validation = credDefProfile.validation;
        delete credDefProfile.validation;
        delete credDefProfile.attributes;
        delete credDefProfile.schema_profile;
        delete credDefProfile.tag;
        return [credDefProfile, attributes, validation];
    }

    // -- Key Guardian calls -- //

    /**
     * TODO move this to a Key-Guardian facade
     */
    private async createKeyGuardianEntry(data: any): Promise<any> {
        const req: any = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/create', // TODO change to 'enroll'
            data
        };
        const result = await this.http.requestWithRetry(req);
        Logger.log('Created first key guardian entry');
        return result.data;
    }

    /**
     * TODO move this to a Key-Guardian facade
     */
    private async addKeyGuardianEntry(id: string, data: any): Promise<any> {
        data.id = id;
        const req: any = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/add',
            data
        };
        const result = await this.http.requestWithRetry(req);
        Logger.log('Added to key guardian');
        return result.data;
    }

    /**
     * TODO move this to a Key-Guardian facade
     * TODO make DRY with verifier.service.ts
     */
    private async verifyWithKeyGuardian(data: any): Promise<any> {
        const req: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.KEY_GUARDIAN_URL + '/v1/escrow/verify',
            data,
        };
        const keyGuardRes = await this.http.requestWithRetry(req);
        return keyGuardRes.data;
    }

    // -- Agent calls -- //

    /**
     * Makes a call to the agent to create a credential definition
     */
    public async createCredDef(schema_id: string, tag: string, support_revocation: boolean, revocation_registry_size : number): Promise<any> {
        const data: any = {
            schema_id,
            tag,
            support_revocation,
        };

        // Only add on revocation registry size if revocation is supported
        if (support_revocation) {
            data.revocation_registry_size =
                (revocation_registry_size > 0) ? revocation_registry_size : parseInt(process.env.DEFAULT_REV_REG_SIZE, 10);
        }
        return await this.agentCaller.callAgent('POST', 'credential-definitions', null, data);
    }

    /**
     * Makes a call to the agent to issue a credential
     */
    public async issueCredentialSend(credentialData: any, connectionId: string, attributes: Array<any>): Promise<any> {
        credentialData.connection_id = connectionId;
        credentialData.credential_proposal.attributes = this.sanitizeAttributes(attributes);
        return await this.agentCaller.callAgent('POST', 'issue-credential/send', null, credentialData);
    }

    /**
     * Returns the status of a credential exchange record
     */
    public async checkCredentialExchange(credentialExchangeId: string): Promise<any> {
        return await this.agentCaller.callAgent('GET', `issue-credential/records/${credentialExchangeId}`);
    }

    /**
     * Revokes credential using the cred_rev_id and rev_reg_id
     */
    public async revokeCredential(credentialExchangeId : string, publish=true): Promise<any> {
        const data = {
            cred_ex_id: credentialExchangeId,
            publish,
        };
        const ret = await this.agentCaller.callAgent('POST', 'revocation/revoke', null, data);

        if (process.env.FLAG_RECORD_ISSUANCES === 'true') {
            await this.recordRevocation(credentialExchangeId, ret);
        }

        return ret;
    }

    /**
     * Informs the credential record service about a revocation
     */
    public async recordRevocation(credential_exchange_id : string, returnData : any) {
        const url = process.env.CREDENTIAL_RECORD_URL + '/revoke/' + credential_exchange_id;
        const today = new Date();
        this.callService('POST', url, {
            revocation_reason: null, // TODO: add an optional reason field to revoke API request body
            revocation_date: today,
            revocation_id: null, // TODO: populate this field from the returned data (or by calling the issuer)
        });
    }

    /**
     * Checks the revocation status of a credential by cred ex id
     * To simplify things we just return the revocation state not the rest of the values aca-py provides
     */
    public async checkRevokedState(credExId: string): Promise<any> {
        const params = {
            cred_ex_id: credExId
        };
        const res = await this.agentCaller.callAgent('GET', 'revocation/credential-record', params);
        return {
            state: res.result.state
        };
    }

    /**
     * Optional: not adding any filters now, but if there's a use case aca-py supports the following:
     *   connection_id, role, state, thread_id
     */
    public async getAllRecords(): Promise<any> {
        const records = await this.agentCaller.callAgent('GET', `issue-credential/records`);
        const formatted = [];
        for (const record of records.results) {
            formatted.push(this.formatRecord(record));
        }
        return formatted;
    }

    /**
     * Deletes credential using the cred_ex_id for issuer
     */
    public async deleteCredential(creExId : string): Promise<any> {
        return await this.agentCaller.callAgent('DELETE', `issue-credential/records/${creExId}`);
    }

    /**
     * The records return from aca-py have a lot of extra data that we don't need, this just includes the
     * Optional: new fields can easily be added if the front end needed
     *   eg right now we don't include photo since they're large, but it's available at: record.credential_offer_dict.credential_preview.offers~attach
     */
    private formatRecord(record: any) {
        // Format aries' style attributes into easier to grok entityData
        const attributes = record.credential_offer_dict.credential_preview.attributes;
        const attribObj = {};
        for (const attribute of attributes) {
            attribObj[attribute.name] = attribute.value;
        }
        return {
            entityData: attribObj,
            connection_id: record.connection_id,
            schema_id: record.schema_id,
            credential_definition_id: record.credential_definition_id,
            credential_exchange_id: record.credential_exchange_id,
            state: record.state,
            created_at: record.created_at,
            thread_id: record.thread_id,
            updated_at: record.updated_at,
            revocation_id: record.revocation_id || null,
            credential_id: record.credential_id || null,
            revoc_reg_id: record.revoc_reg_id || null,
        };
    }

    /**
     * Fetches a registered DID or creates a new one
     * Then requests that a configured Steward onboard the DID with the Endorser role (so they can issue credentials)
     * Then publicizes the DID for the agent so they can make public calls
     * TODO right now the steward will automatically approve - eventually we want some manual process for the Steward to decide on approvals
     */
    public async requestEndorser(): Promise<any> {
        if (!process.env.STEWARD_URL) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_NODE_ENVIRONMENT, 'Environment variable STEWARD_URL is missing');
        }

        // If there's already a DID registered, use that one, otherwise create a new one.
        let didInfo;
        let res = await this.agentCaller.callAgent('GET', `wallet/did`);
        if (res.results && res.results.length > 0) {
            didInfo = res.results[0];
        } else {
            // Create a new did
            res = await this.agentCaller.callAgent('POST', `wallet/did/create`);
            didInfo = res.result;
        }
        const did = didInfo.did;
        const verkey = didInfo.verkey;

        // Request that steward onboard this DID as an Endorser
        const agentId = this.controllerHandler.handleAgentId();
        const req: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.STEWARD_URL + '/v1/steward/endorser',
            data: {
                did,
                verkey,
                alias: agentId
            }
        };
        await this.http.requestWithRetry(req);

        // Publicize DID
        await this.agentCaller.callAgent('POST', `wallet/did/public`, { did });

        // Save the did and verkey data to profile for later use
        await this.profileManager.append(agentId, 'did', did);
        await this.profileManager.append(agentId, 'verkey', verkey);

        return { success: true };
    }

    /**
     * Convenince endpoint that combines both creating a schema and creating a cred def
     * If a schemaId is provided then we use that for the cred def, and don't create a new schema
     * @tothink it's possible to override an existing profile, which could be ok, but maybe we could display a warning or something
     */
    public async addSchemaAndCredDef(body: SchemaCredDefReqDto): Promise<any> {
        // Set defauts
        const schemaVersion = body.schemaVersion ?? '1.0.0';
        const schemaProfileName = body.schemaProfileName ?? `${body.schemaName}.schema.json`;
        const tag = body.tag ?? 'tag1';
        const supportRevocation = body.supportRevocation ?? false;
        const revocationRegistrySize  = body.revocationRegistrySize ?? 100;
        const credDefProfileName = body.credDefProfileName ?? `${body.schemaName}.cred.def.json`;

        // Create schema
        let schemaId = body.schemaId;
        if (!schemaId) {
            const data = {
                schema_name: body.schemaName,
                schema_version: schemaVersion,
                attributes: body.attributes,
            };
            const schemaRes = await this.agentCaller.callAgent('POST', 'schemas', null, data);
            schemaId = schemaRes.schema_id;
            // Save the schema to profiles
            await this.profileManager.save(schemaProfileName, {
                schema_name: body.schemaName,
                schema_version: schemaVersion,
                schema_id: schemaId,
                comment: body.schemaComment || '',
                attributes: body.attributes,
            });
        }

        // Create cred def
        const credDefRes = await this.createCredDef(schemaId, tag, supportRevocation, revocationRegistrySize);
        const credDefId = credDefRes.credential_definition_id;
        // Save the cred def to profiles
        await this.profileManager.save(credDefProfileName, {
            schema_name: body.schemaName,
            schema_id: schemaId,
            comment: body.credDefcomment || '',
            attributes: body.attributes,
            cred_def_id: credDefId,
            credential_proposal: {}
        });

        return {
            schemaId,
            credDefId,
            success: true
        };
    }
}

import request from 'supertest';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * This test goes through the simplified flow of registering an agent, creating schemas, issuing and verifying credentials,etc
 */
describe('Tests simplified example flow', () => {

    const sascUrl = 'http://localhost:3030';
    const mamcUrl = 'http://localhost:3033';
    let invitation;
    let connectionId
    let schemaId;
    let presentationExchangeId

    beforeAll(async () => {
        jest.setTimeout(30000);
    });

    it('Register multi agent in multi controller', async () => {
        const data = {
            'label': 'Multi agent multi controller',
        }
        return request(mamcUrl)
            .post('/v2/api/agent/register')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.agentId).toBe('mamcagent3');
            });
    });

    it('Publicize steward DID on sasc', async () => {
        const data = {
            did: 'Th7MpTaRZVRYnPiabds81Y'
        }
        return request(sascUrl)
            .post('/v1/agent/publicize-did')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.result.did).toBe('Th7MpTaRZVRYnPiabds81Y');
            });
    });

    it('Request mamc be registered as endorser', async () => {
        return request(mamcUrl)
            .post('/v2/api/endorser/request')
            .set('agent', 'mamcagent3')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.success).toBe(true);
            });
    });

    it('Create schema and cred def', async () => {
        const data = {
            schemaName: 'TestSchema1',
            attributes: [
                'attr1',
                'attr2'
            ]
        }
        return request(mamcUrl)
            .post('/v2/api/schema-cred-def')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.schemaId).toBeDefined();
                expect(res.body.credDefId).toBeDefined();
                schemaId = res.body.schemaId;
            });
    });

    it('Create cred def using existing schema', async () => {
        const data = {
            schemaName: 'TestSchema',
            schemaId,
            tag: 'tag2',
            attributes: [
                'attr1',
                'attr2'
            ]
        }
        return request(mamcUrl)
            .post('/v2/api/schema-cred-def')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.schemaId).toBeDefined();
                expect(res.body.credDefId).toContain('tag2');
            });
    });

    it('Init connection from sasc to mamc3', async () => {
        return request(sascUrl)
            .post('/v2/api/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
            });
    });

    it('mamc3 accepts invitation from sasc', async () => {
        const data = {
            alias: 'sasc',
            invitation,
        }
        return request(mamcUrl)
            .post('/v1/agent/accept-connection')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
                connectionId = res.body.connection_id;
            });
    });
   
    it('mamc3 issues credential to sasc', async () => {
        await ProtocolUtility.delay(3000);
        const data = {
            connectionId,
            profile: 'TestSchema1.cred.def.json',
            entityData: {
                attr1: 'value1',
                attr2: 'value2'
            }
        }
        return request(mamcUrl)
            .post('/v2/api/issue')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
                expect(res.body.credential_definition_id).toBeDefined();
            });
    });

    it('mamc3 saves a proof request profile', async () => {
        const data = {
            'profileName': 'test.proof.request.json',
            'profile': {
                'comment': 'Test proof request profile',
                'proof_request':{
                    'name': 'TestProofRequest',
                    'version':'1.0.0',
                    'requested_attributes':{
                        'attr1':{
                            'name':'attr1',
                            'restrictions': []
                        },
                        'attr2':{
                            'name':'attr2',
                            'restrictions': []
                        }
                    },
                    'requested_predicates':{}
                }
            }
        }
        return request(mamcUrl)
            .post('/v2/api/profiles')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
            });
    });

    it('mamc3 initiates verify request sasc', async () => {
        await ProtocolUtility.delay(3000);
        const data = {
            connectionId,
            profile: 'test.proof.request.json',
        }
        return request(mamcUrl)
            .post('/v2/api/verify')
            .set('agent', 'mamcagent3')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.presentation_exchange_id).toBeDefined();
                presentationExchangeId = res.body.presentation_exchange_id;
            });
    });

    it('mamc3 verifies verify request', async () => {
        await ProtocolUtility.delay(3000);
        return request(mamcUrl)
            .get('/v2/api/verify/' + presentationExchangeId)
            .set('agent', 'mamcagent3')
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.verified).toBe('true');
            });
    });
});

import request from 'supertest';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * This test goes through the simplified flow of registering an agent, creating schemas, issuing and verifying credentials,etc
 */
describe('Tests simplified example flow', () => {

    const sascUrl = 'http://localhost:3030';
    const mamcUrl = 'http://localhost:3033';

    beforeAll(async () => {
        jest.setTimeout(20000);
    });

    it('Register multi agent in multi controller', async () => {
        const data = {
            "label": "Multi agent multi controller",
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
   
});
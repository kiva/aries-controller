import request from 'supertest';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * This test goes over the 4 combinations of single/multi agent/controller and ensures the basic functionality works
 * This test depends on the docker-compose.yml with the 4 combinations and the agency docker compose
 * Note the single controller instances don't need to have an agent registered because that happens automatically at start up,
 *   only the multi controllers need agents to be registered via an endpoint call
 */
describe('Set of tests for single vs multi agent and single vs multi controller', () => {

    const sascUrl = 'http://localhost:3030';
    const samcUrl = 'http://localhost:3031';
    const mascUrl = 'http://localhost:3032';
    const mamcUrl = 'http://localhost:3033';

    beforeAll(async () => {

    });

    it('Register single agent in multi controller', async () => {
        const data = {
            "walletId": "samcwalletid",
            "walletKey": "samcwalletkey",
            "seed": "0000000000000000000000000Random1",
            "controllerUrl": "http://sa-mc-controller:3031/v1/controller",
            "label": "Single agent multi controller",
            "useTailsServer": false,
            "agentId": "samcagent",
            "adminApiKey": "samcAdminApiKey"
        }
        return request(samcUrl)
            .post('/v1/agent/register')
            .set('agent', 'samcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.agentId).toBe('samcagent');
            });
    });

    it('Register multi agent in multi controller', async () => {
        // Note that multi agents don't need seed, useTailsServer or adminApiKey
        const data = {
            "walletId": "mamcwalletid",
            "walletKey": "mamcwalletkey",
            "controllerUrl": "http://ma-mc-controller:3031/v1/controller",
            "label": "Multi agent multi controller",
            "agentId": "mamcagent",
        }
        return request(mamcUrl)
            .post('/v1/agent/register')
            .set('agent', 'mamcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.success).toBe(true);
            });
    });

    it('Init connection with single agent single controller', async () => {
        return request(sascUrl)
            .post('/v1/agent/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Init connection with single agent multi controller', async () => {
        return request(samcUrl)
            .post('/v1/agent/connection')
            .set('agent', 'samcagent')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Init connection with multi agent single controller', async () => {
        return request(mascUrl)
            .post('/v1/agent/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Init connection with multi agent multi controller', async () => {
        return request(mamcUrl)
            .post('/v1/agent/connection')
            .set('agent', 'mamcagent')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });
});
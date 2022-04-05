import request from 'supertest';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * This test executes some common error cases
 * Specifically when a single agent or multi agent goes down, that we restart it on agent call
 */
describe('Set of tests for single vs multi agent and single vs multi controller', () => {

    const sascUrl = 'http://localhost:3030';
    const mamcUrl = 'http://localhost:3033';
    const agencyUrl = 'http://localhost:3010';
    let walletId: string;
    let walletKey: string;

    beforeAll(() => {
        jest.setTimeout(20000);
    });

    it('Init connection with single agent single controller (sanity check)', async () => {
        return await request(sascUrl)
            .post('/v2/api/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Delete single agent', async () => {
        const data = {
            agentId: 'sascagent'
        };
        return await request(agencyUrl)
            .delete('/v1/manager')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(200);
            });
    });

    it('Init connection with single agent single controller (ensure restarted)', async () => {
        await ProtocolUtility.delay(500);
        return await request(sascUrl)
            .post('/v2/api/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Register multi agent in multi controller', async () => {
        const data = {
            'label': 'Multi agent multi controller',
            'agentId': 'mamcagent2',
        };
        return await request(mamcUrl)
            .post('/v1/agent/register')
            .set('agent', 'mamcagent2')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.agentId).toBe('mamcagent2');
                walletId = res.body.walletId;
                walletKey = res.body.walletKey;
            });
    });

    it('Init connection with multi agent multi controller (sanity check)', async () => {
        return await request(mamcUrl)
            .post('/v2/api/connection')
            .set('agent', 'mamcagent2')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Unregister agent with agency', async () => {
        const data = {
            'walletName': walletId,
            walletKey,
        };
        return await request(agencyUrl)
            .delete('/v2/multitenant')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(200);
            });
    });

    it('Init connection with multi agent multi controller (ensure restarted)', async () => {
        await ProtocolUtility.delay(500);
        return await request(mamcUrl)
            .post('/v2/api/connection')
            .set('agent', 'mamcagent2')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
            });
    });

});
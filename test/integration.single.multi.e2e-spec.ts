import request from 'supertest';
import { ProtocolUtility } from 'protocol-common';

jest.setTimeout(20000);

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
    let sascInvitation;
    let samcInvitation;
    let mascInvitation;
    let mamcInvitation;
    let sascConnectionId: string;
    let samcConnectionId: string;
    let mascConnectionId: string;
    let mamcConnectionId: string;

    it('Register single agent in multi controller', () => {
        const data = {
            'seed': '0000000000000000000000000Random1',
            'label': 'Single agent multi controller',
            'useTailsServer': false,
            'adminApiKey': 'samcAdminApiKey'
        };
        return request(samcUrl)
            .post('/v1/agent/register')
            .set('agent', 'samcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.agentId).toBe('samcagent');
            });
    });

    it('Register multi agent in multi controller', () => {
        // Note that multi agents don't need seed, useTailsServer or adminApiKey
        const data = {
            'label': 'Multi agent multi controller',
        };
        return request(mamcUrl)
            .post('/v1/agent/register')
            .set('agent', 'mamcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.agentId).toBe('mamcagent');
            });
    });

    it('Init connection with single agent single controller', async () => {
        await ProtocolUtility.delay(3000);
        return request(sascUrl)
            .post('/v2/api/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
                sascInvitation = res.body.invitation;
            });
    });

    it('Init connection with single agent multi controller', () => {
        return request(samcUrl)
            .post('/v2/api/connection')
            .set('agent', 'samcagent')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
                samcInvitation = res.body.invitation;
            });
    });

    it('Init connection with multi agent single controller', async () => {
        await ProtocolUtility.delay(1000);
        return request(mascUrl)
            .post('/v2/api/connection')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
                mascInvitation = res.body.invitation;
            });
    });

    it('Init connection with multi agent multi controller', () => {
        return request(mamcUrl)
            .post('/v2/api/connection')
            .set('agent', 'mamcagent')
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.invitation).toBeDefined();
                mamcInvitation = res.body.invitation;
            });
    });

    it('sasc accepts invitation from samc', () => {
        const data = {
            alias: 'samc',
            invitation: samcInvitation,
        };
        return request(sascUrl)
            .post('/v1/agent/accept-connection')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
                sascConnectionId = res.body.connection_id;
            });
    });

    it('samc accepts invitation from masc', () => {
        const data = {
            alias: 'masc',
            invitation: mascInvitation,
        };
        return request(samcUrl)
            .post('/v1/agent/accept-connection')
            .set('agent', 'samcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
                samcConnectionId = res.body.connection_id;
            });
    });

    it('masc accepts invitation from mamc', () => {
        const data = {
            alias: 'mamc',
            invitation: mamcInvitation,
        };
        return request(mascUrl)
            .post('/v1/agent/accept-connection')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
                mascConnectionId = res.body.connection_id;
            });
    });

    it('mamc accepts invitation from sasc (using agent call endpoint)', () => {
        const data = {
            method: 'POST',
            route: 'connections/receive-invitation',
            params: {
                alias: 'sasc'
            },
            data: sascInvitation
        };
        return request(mamcUrl)
            .post('/v2/api/agent')
            .set('agent', 'mamcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.connection_id).toBeDefined();
                mamcConnectionId = res.body.connection_id;
            });
    });

    it('sasc checks connection status', async () => {
        await ProtocolUtility.delay(3000);
        return request(sascUrl)
            .get(`/v2/api/connection/${sascConnectionId}`)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.state).toBe('response');
            });
    });

    it('samc checks connection status', () => {
        return request(samcUrl)
            .get(`/v2/api/connection/${samcConnectionId}`)
            .set('agent', 'samcagent')
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.state).toBe('response');
            });
    });

    it('masc checks connection status', () => {
        return request(mascUrl)
            .get(`/v2/api/connection/${mascConnectionId}`)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.state).toBe('response');
            });
    });

    it('mamc checks connection status (using agent call endpoint)', () => {
        const data = {
            method: 'GET',
            route: `connections/${mamcConnectionId}`
        };
        return request(mamcUrl)
            .post('/v2/api/agent')
            .set('agent', 'mamcagent')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
                expect(res.body.state).toBe('response');
            });
    });
});

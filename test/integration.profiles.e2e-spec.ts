import request from 'supertest';

jest.setTimeout(20000);

/**
 * This test goes over the 4 combinations of single/multi agent/controller and ensures the basic functionality works
 * This test depends on the docker-compose.yml with the 4 combinations and the agency docker compose
 * Note the single controller instances don't need to have an agent registered because that happens automatically at start up,
 *   only the multi controllers need agents to be registered via an endpoint call
 */
describe('Set of tests for single vs multi agent and single vs multi controller', () => {

    const sascUrl = 'http://localhost:3030';
    const profile1 = {
        'testKey': 'testValue1'
    };
    const profile2 = {
        'testKey': 'testValue2'
    };

    it('Returns profiles from disk', () => {
        return request(sascUrl)
        .get('/v2/api/profiles')
        .expect(200)
        .expect((res) => {
            expect(res.body['profile.json']).toStrictEqual({'example': 'profile'});
        });
    });

    it('Add profile 1', () => {
        const data = {
            'profileName': 'profile1.json',
            'profile': profile1
        };
        return request(sascUrl)
            .post('/v2/api/profiles')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
            });
    });

    it('Add profile 2', () => {
        const data = {
            'profileName': 'profile2.json',
            'profile': profile2
        };
        return request(sascUrl)
            .post('/v2/api/profiles')
            .send(data)
            .expect((res) => {
                expect(res.status).toBe(201);
            });
    });

    it('Fetch profiles', () => {
        return request(sascUrl)
            .get('/v2/api/profiles')
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body['profile1.json']).toStrictEqual(profile1);
                expect(res.body['profile2.json']).toStrictEqual(profile2);
            });
    });

    it('Delete profile 1', () => {
        return request(sascUrl)
            .delete('/v2/api/profiles/profile1.json')
            .expect((res) => {
                expect(res.status).toBe(200);
            });
    });

    it('Fetch profiles', () => {
        return request(sascUrl)
            .get('/v2/api/profiles')
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body['profile1.json']).toBeUndefined();
            });
    });
});

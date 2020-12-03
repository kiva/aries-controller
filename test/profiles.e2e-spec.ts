import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [ AppModule ]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('Returns profiles', () => {
        return request(app.getHttpServer())
        .get('/v2/api/profiles')
        .expect(200)
        .expect((res) => {
            expect(res.body).toStrictEqual({'profile.json': {'example': 'profile'}});
        });
    });

});

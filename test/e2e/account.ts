import request from 'supertest';
import server from '../../src/server';
// import AccountService from '../../src/services/AccountService';
import db from '../../src/util/database';

const http = request(server);

describe('Account Controller', () => {
    const poolAddress = '0x287aAa0f0089069A115AF9D25f0adeB295b52964';
    const accountEmail = 'test@test.com';
    const accountSecret = 'mellon';
    let authHeader: string, basicAuthHeader: string, accountId: string;

    afterAll(async () => {
        await db.truncate();
        server.close();
    });

    describe('POST /reg', () => {
        it('HTTP 201', async (done) => {
            const res = await http.post('/reg').send({
                application_type: 'web',
                client_name: 'thx_api',
                grant_types: ['client_credentials'],
                redirect_uris: [],
                response_types: [],
                scope: 'openid account:read account:write',
            });
            basicAuthHeader =
                'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64');

            expect(res.status).toBe(201);
            done();
        });
    });

    describe('POST /token', () => {
        it('HTTP 200 (success)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': basicAuthHeader,
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid account:read account:write',
                });
            authHeader = `Bearer ${res.body.access_token}`;

            expect(res.status).toBe(200);
            done();
        });
    });

    describe('POST /account', () => {
        it('HTTP 200', async (done) => {
            const res = await http
                .post('/account')
                .set({
                    Authorization: authHeader,
                })
                .send({
                    email: accountEmail,
                    secret: accountSecret,
                    poolAddress,
                });
            expect(res.status).toBe(201);
            accountId = res.body.id;
            done();
        });
    });

    describe('GET /account/:id', () => {
        it('HTTP 200', async (done) => {
            const res = await http
                .get(`/account/${accountId}`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.status).toBe(200);
            expect(res.body.address).toBeDefined();
            expect(res.body.privateKey).toBeUndefined();

            done();
        });
    });

    // describe('PATCH /account/:id', () => {
    //     it('HTTP 200', async (done) => {
    //         const res = await http.patch(`/account/${accountId}`).set({
    //             Authorization: authHeader,
    //         });
    //         console.log(res.body);
    //         expect(res.status).toBe(200);
    //         done();
    //     });
    // });
});

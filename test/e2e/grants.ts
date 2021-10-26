import request from 'supertest';
import server from '../../src/server';
import AccountService from '../../src/services/AccountService';
import db from '../../src/util/database';
import { accountEmail, accountSecret, poolAddress } from './lib/constants';

const http = request(server);

describe('OAuth2 Grants', () => {
    let authHeader: string, accessToken: string, accountId: string;

    beforeAll(async () => {
        const { account, error } = await AccountService.signupFor(accountEmail, accountSecret, poolAddress);
        if (error) console.log(error);
        accountId = account.id;
    });

    afterAll(async () => {
        await db.truncate();
        server.close();
    });

    describe('GET /.well-known/openid-configuration', () => {
        it('HTTP 200', async (done) => {
            const res = await http.get('/.well-known/openid-configuration');
            expect(res.status).toBe(200);
            done();
        });
    });

    describe('GET /account', () => {
        it('HTTP 401 Unauthorized', async (done) => {
            const res = await http.get('/account');
            expect(res.status).toBe(401);
            done();
        });
    });

    describe('GET /reg', () => {
        it('HTTP 201', async (done) => {
            const res = await http.post('/reg').send({
                application_type: 'web',
                client_name: 'THX API',
                grant_types: ['client_credentials'],
                redirect_uris: [],
                response_types: [],
                scope: 'openid account:read account:write',
            });
            authHeader = 'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64');

            expect(res.status).toBe(201);
            done();
        });
    });

    describe('GET /token', () => {
        it('HTTP 401 (invalid access token)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'incorrect authorization code',
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid account:read account:write',
                });
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                error: 'invalid_request',
                error_description: 'invalid authorization header value format',
            });
            done();
        });
        it('HTTP 401 (invalid grant)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                })
                .send({
                    grant_type: 'authorization_code',
                    scope: 'openid account:read account:write',
                });
            expect(res.body).toMatchObject({
                error: 'unauthorized_client',
                error_description: 'requested grant type is not allowed for this client',
            });
            expect(res.status).toBe(400);
            done();
        });

        it('HTTP 401 (invalid scope)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid admin user',
                });
            expect(res.body).toMatchObject({
                error: 'invalid_scope',
                error_description: 'requested scope is not whitelisted',
                scope: 'admin',
            });
            expect(res.status).toBe(400);
            done();
        });

        it('HTTP 200 (success)', async (done) => {
            const res = await http
                .post('/token')
                .set({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader,
                })
                .send({
                    grant_type: 'client_credentials',
                    scope: 'openid account:read account:write',
                });
            accessToken = res.body.access_token;

            expect(res.status).toBe(200);
            expect(accessToken).toBeDefined();
            done();
        });
    });

    describe('GET /account/:id', () => {
        it('HTTP 403', async (done) => {
            const res = await http
                .get(`/account/${accountId}`)
                .set({ 'Authorization': `Bearer ${accessToken}`, 'X-AssetPool': poolAddress })
                .send();
            expect(res.status).toBe(200);
            done();
        });
    });
});

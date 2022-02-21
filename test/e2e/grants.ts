import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import AccountService from '../../src/services/AccountService';
import { INITIAL_ACCESS_TOKEN } from '../../src/util/secrets';
import { accountEmail, accountSecret } from './lib/constants';

const http = request.agent(server);

describe('OAuth2 Grants', () => {
    let authHeader: string, accessToken: string, accountId: string;

    beforeAll(async () => {
        const account = await AccountService.signupFor(accountEmail, accountSecret);
        accountId = account.id;
    });

    afterAll(async () => {
        await db.truncate();
        server.close();
    });

    describe('GET /.well-known/openid-configuration', () => {
        it('HTTP 200', async () => {
            const res = await http.get('/.well-known/openid-configuration');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /account', () => {
        it('HTTP 401 Unauthorized', async () => {
            const res = await http.get('/account');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /reg', () => {
        it('HTTP 201', async () => {
            const res = await http
                .post('/reg')
                .set({ Authorization: `Bearer ${INITIAL_ACCESS_TOKEN}` })
                .send({
                    application_type: 'web',
                    client_name: 'THX API',
                    grant_types: ['client_credentials'],
                    redirect_uris: [],
                    response_types: [],
                    scope: 'openid account:read account:write',
                });
            authHeader = 'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64');

            expect(res.status).toBe(201);
        });
    });

    describe('GET /token', () => {
        it('HTTP 401 (invalid access token)', async () => {
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
        });
        it('HTTP 401 (invalid grant)', async () => {
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
        });

        it('HTTP 401 (invalid scope)', async () => {
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
        });

        it('HTTP 200 (success)', async () => {
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
        });
    });

    describe('GET /account/:id', () => {
        it('HTTP 403', async () => {
            const res = await http
                .get(`/account/${accountId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();
            expect(res.status).toBe(200);
        });
    });
});

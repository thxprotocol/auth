import nock from 'nock';
import request from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import AccountService from '../../src/services/AccountService';
import { INITIAL_ACCESS_TOKEN } from '../../src/util/secrets';
import { accountAddress, accountEmail, accountSecret } from './lib/constants';
import { TWITTER_API_ENDPOINT } from '../../src/services/TwitterService';

const http = request.agent(server);

describe('Account Controller', () => {
    let authHeader: string, basicAuthHeader: string, accountId: string;

    beforeAll(async () => {
        async function requestToken() {
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
            return `Bearer ${res.body.access_token}`;
        }

        async function registerClient() {
            const res = await http
                .post('/reg')
                .set({ Authorization: `Bearer ${INITIAL_ACCESS_TOKEN}` })
                .send({
                    application_type: 'web',
                    client_name: 'thx_api',
                    grant_types: ['client_credentials'],
                    redirect_uris: [],
                    response_types: [],
                    scope: 'openid account:read account:write',
                });

            return 'Basic ' + Buffer.from(`${res.body.client_id}:${res.body.client_secret}`).toString('base64');
        }

        basicAuthHeader = await registerClient();
        authHeader = await requestToken();
    });

    afterAll(async () => {
        await db.truncate();
        server.close();
    });

    describe('POST /account', () => {
        it('HTTP 200', async () => {
            const res = await http
                .post('/account')
                .set({
                    Authorization: authHeader,
                })
                .send({
                    email: accountEmail,
                    password: accountSecret,
                });
            expect(res.status).toBe(201);

            accountId = res.body.id;
        });
    });

    describe('GET /account/:id', () => {
        it('HTTP 200', async () => {
            const res = await http
                .get(`/account/${accountId}`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.status).toBe(200);
            expect(res.body.address).toBeDefined();
            expect(res.body.privateKey).toBeUndefined();
        });
    });

    describe('PATCH /account/:id', () => {
        it('HTTP 200', async () => {
            const res = await http
                .patch(`/account/${accountId}`)
                .set({
                    Authorization: authHeader,
                })
                .send({
                    address: accountAddress,
                });
            expect(res.status).toBe(204);
        });

        it('HTTP 200', async () => {
            const res = await http
                .get(`/account/${accountId}`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.status).toBe(200);
            expect(res.body.address).toBe(accountAddress);
        });
    });

    describe('GET /account/:id (remove address)', () => {
        it('HTTP 200', async () => {
            const { account } = await AccountService.get(accountId);
            account.address = '';
            await account.save();

            const res = await http
                .get(`/account/${accountId}`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.status).toBe(200);
            expect(res.body.address).toBe('');
            expect(res.body.privateKey).toBeUndefined();
        });
    });

    describe('POST /account (generate address)', () => {
        it('HTTP 200', async () => {
            const res = await http
                .post('/account')
                .set({
                    Authorization: authHeader,
                })
                .send({
                    email: accountEmail,
                    password: accountSecret,
                });
            expect(res.status).toBe(201);
            expect(res.body.id).toBe(accountId);
            expect(res.body.address).toBeDefined();
        });
    });

    describe('GET /account/:sub/twitter', () => {
        let testAccountId = '';

        beforeAll(async () => {
            const { account } = await AccountService.getByEmail(accountEmail);
            await account.save();

            testAccountId = account._id;
        });

        beforeEach(() => {
            nock(TWITTER_API_ENDPOINT)
                .persist()
                .get(/.*?/)
                .reply(200, { data: { data: {} } });
        });

        it('Denice Access if there no authorization header', async () => {
            const res = await http.get(`/account/${testAccountId}/twitter`).send();
            expect(res.status).toEqual(401);
        });

        it('Throw Error if there no linked twitter', async () => {
            const res = await http
                .get(`/account/${testAccountId}/twitter`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.body.isAuthorized).toEqual(false);
        });

        it('Successfully get linked Twitter info with a correct infomation', async () => {
            const { account } = await AccountService.getByEmail(accountEmail);
            account.twitterAccessToken = 'TOKEN';
            account.twitterRefreshToken = 'REFRESH';
            account.twitterAccessTokenExpires = (Date.now() + 1000000) * 1000;
            await account.save();

            const res = await http
                .get(`/account/${testAccountId}/twitter`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.body.isAuthorized).toEqual(true);
        });
    });

    describe('GET /account/:sub/youtube', () => {
        let testAccountId = '';

        beforeAll(async () => {
            const { account } = await AccountService.getByEmail(accountEmail);
            await account.save();

            testAccountId = account._id;
        });

        it('Denice Access if there no authorization header', async () => {
            const res = await http.get(`/account/${testAccountId}/youtube`).send();
            expect(res.status).toEqual(401);
        });

        it('Throw Error if there no linked youtube', async () => {
            const res = await http
                .get(`/account/${testAccountId}/youtube`)
                .set({
                    Authorization: authHeader,
                })
                .send();
            expect(res.body.isAuthorized).toEqual(false);
        });
    });
});

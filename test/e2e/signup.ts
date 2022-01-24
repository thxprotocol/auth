import nock from 'nock';
import request from 'supertest';
import server from '../../src/server';
import AccountService from '../../src/services/AccountService';
import db from '../../src/util/database';
import { INITIAL_ACCESS_TOKEN } from '../../src/util/secrets';
import { getPath } from './lib';

describe('Sign up', () => {
    let CID = '';
    let CLIENT_ID = '';
    let CLIENT_SECRET = '';
    const REDIRECT_URL = 'https://localhost:8082/signin-oidc';
    const NEW_ACCOUNT_EMAIL = 'test@thx.network';
    const NEW_ACCOUNT_PASSWORD = '123asdASD@#@#!!';
    const http = request.agent(server);

    beforeAll(async () => {
        const res = await http
            .post('/reg')
            .set({ Authorization: `Bearer ${INITIAL_ACCESS_TOKEN}` })
            .send({
                application_type: 'web',
                client_name: 'THX Dashboard',
                grant_types: ['authorization_code'],
                redirect_uris: ['https://localhost:8082/signin-oidc'],
                response_types: ['code'],
                scope: 'openid dashboard user',
            });

        CLIENT_ID = res.body.client_id;
        CLIENT_SECRET = res.body.client_secret;
    });

    afterAll(async () => {
        await db.truncate();
        server.close();
    });

    describe('GET /auth', () => {
        it('Successfully get CID', async () => {
            const params = new URLSearchParams({
                prompt: 'create',
                client_id: CLIENT_ID,
                return_url: 'https://localhost:8082',
                response_type: 'code',
                response_mode: 'query',
                redirect_uri: REDIRECT_URL,
                scope: 'openid dashboard',
            });

            const res = await http.get(`/auth?${params.toString()}`).send();

            expect(res.status).toEqual(302);
            expect(res.header.location).toMatch(new RegExp('/oidc/.*'));

            CID = (res.header.location as string).split('/')[2];
        });
    });

    describe('POST /oidc/<cid>/create', () => {
        it('Failed to create account with weak password', async () => {});
        it('Failed to create account with empty email', async () => {});
        it('Failed to create account with empty password', async () => {});
        it('Failed to create account with registered email', async () => {});

        describe('Sign up flow', () => {
            nock('https://api.sendgrid.com').post('/v3/mail/send').reply(200, {}); // mock email response for account create method

            it('Successfully create an account', async () => {
                const res = await http
                    .post(`/oidc/${CID}/create`)
                    .send(
                        `email=${NEW_ACCOUNT_EMAIL}&password=${NEW_ACCOUNT_PASSWORD}&confirmPassword=${NEW_ACCOUNT_PASSWORD}&acceptTermsPrivacy=true&returnUrl="https://localhost:8082"`,
                    );

                expect(res.text).toMatch(new RegExp('.*THX for signing up*'));
            });
        });
    });
});

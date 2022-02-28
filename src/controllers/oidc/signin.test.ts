import request from 'supertest';
import app from '../../app';
import { AccountService } from '../../services/AccountService';
import db from '../../util/database';
import { INITIAL_ACCESS_TOKEN } from '../../util/secrets';
import { getPath, accountEmail, accountSecret } from '../../util/jest';

const REDIRECT_URL = 'https://localhost:8082/signin-oidc';

describe('Sign In', () => {
    let CID = '';
    const http = request.agent(app);
    let CLIENT_ID = '';
    let CLIENT_SECRET = '';

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

    beforeAll(async () => {
        const account = await AccountService.signup(accountEmail, accountSecret, true, true, true);
        account.privateKey = undefined;
        await account.save();
    });

    afterAll(async () => {
        await db.truncate();
        db.disconnect();
    });

    describe('GET /auth', () => {
        it('Successfully get CID', async () => {
            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URL,
                scope: 'openid user dashboard',
                response_type: 'code',
                response_mode: 'query',
                nonce: 'xun4kvy4mh',
            });

            const res = await http.get(`/auth?${params.toString()}`).send();

            expect(res.status).toEqual(302);
            expect(res.header.location).toMatch(new RegExp('/oidc/.*'));

            CID = (res.header.location as string).split('/')[2];
        });
    });

    describe('POST /oidc/<cid>/login', () => {
        describe('Login flow check', () => {
            let redirectUrl = '';
            let Cookies = '';
            let code = '';

            it('Successful login with correct information', async () => {
                const res = await http
                    .post(`/oidc/${CID}/login`)
                    .send(`email=${accountEmail}&password=${accountSecret}`);

                expect(res.status).toEqual(302);

                redirectUrl = getPath(res.header.location);
            });

            it('Redirect to interaction', async () => {
                const res = await http.get(redirectUrl).set('Cookie', Cookies).send();
                expect(res.status).toEqual(302);
                redirectUrl = res.header.location;
                Cookies += res.headers['set-cookie']?.join('; ');
            });

            it('Redirect to consent page', async () => {
                const res = await http.get(redirectUrl).set('Cookie', Cookies).send();
                expect(res.status).toEqual(302);
                redirectUrl = getPath(res.header.location);
                Cookies += res.headers['set-cookie']?.join('; ');
            });

            it('Redirect back to callback URL with auth code', async () => {
                const res = await http.get(redirectUrl).set('Cookie', Cookies).send();
                expect(res.status).toEqual(302);
                redirectUrl = res.header.location;
                Cookies += res.headers['set-cookie']?.join('; ');
                code = redirectUrl.split('code=')[1].split('&')[0];
                expect(redirectUrl.includes(REDIRECT_URL)).toEqual(true);
            });

            it('Request access token', async () => {
                const authHeader = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

                const res = await http
                    .post('/token')
                    .set({
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': authHeader,
                    })
                    .send({
                        grant_type: 'authorization_code',
                        code,
                    });

                expect(res.status).toEqual(200);
            });
        });

        it('Failed to login with wrong credential', async () => {
            const res = await http
                .post(`/oidc/${CID}/login`)
                .send('email=fake.user@thx.network&password=thisgoingtofail');

            expect(res.status).toEqual(200);
            expect(res.text).toMatch(new RegExp('.*Could not find an account for this address*'));
        });

        it('Failed to login with wrong password', async () => {
            const res = await http.post(`/oidc/${CID}/login`).send(`email=${accountEmail}&password=thisgoingtofail`);
            expect(res.status).toEqual(200);
            expect(res.text).toMatch(new RegExp('.*Your provided passwords do not match*'));
        });
    });
});

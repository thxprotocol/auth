import request from 'supertest';
import server from '../../src/server';

const CLIENT_ID = 'puqOQ6ZT9U8UsfyzuTIwT';
const CLIENT_SECRET = 'VVrUT7n82KNcuh947RAI-dqY79K8r47k_Xk9WvdKXl_viltV5kzX5oNDjen97vr0pBRSlv3oGZvz3_ka1136LQ';
const REDIRECT_URL = 'https://localhost:8082/signin-oidc';

function getPath(url: string) {
    return '/' + url.split('/')[3] + '/' + url.split('/')[4];
}

describe('Sign In', () => {
    let uid = '';
    const http = request.agent(server);

    describe('GET /auth', () => {
        it('Successfully get UID', async () => {
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

            uid = (res.header.location as string).split('/')[2];
        });
    });

    describe('POST /oidc/<uid>/login', () => {
        describe('Login flow check', () => {
            let redirectUrl = '';
            let Cookies = '';

            it('Successful login with correct information', async () => {
                const res = await http.post(`/oidc/${uid}/login`).send({
                    email: 'peter@thx.network',
                    password: 'qpwoei',
                });
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

            let code = '';
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
            const res = await http.post(`/oidc/${uid}/login`).send({
                email: 'fake.user@thx.network',
                password: 'thisgoingtofail',
            });
            expect(res.status).toEqual(200);
            expect(res.text).toMatch(new RegExp('.*Cannot read property.*'));
        });

        it('Failed to login with wrong password', async () => {
            const res = await http.post(`/oidc/${uid}/login`).send({
                email: 'peter@thx.network',
                password: 'thisgoingtofail',
            });
            expect(res.status).toEqual(200);
            expect(res.text).toMatch(new RegExp('.*Your provided passwords do not match*'));
        });
    });

    afterAll(async () => {
        server.close();
    });
});

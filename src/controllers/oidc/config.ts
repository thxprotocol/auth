import jwks from '../../jwks.json';
import MongoAdapter from './adapter';
import { Account } from '../../models/Account';
import { AccountDocument } from '../../models/Account';
import { ENVIRONMENT, INITIAL_ACCESS_TOKEN, SECURE_KEY } from '../../util/secrets';
import { interactionPolicy } from 'oidc-provider';

const basePolicy = interactionPolicy.base();
const promptReset = new interactionPolicy.Prompt({ name: 'reset', requestable: true });
const promptCreate = new interactionPolicy.Prompt({ name: 'create', requestable: true });
const promptConfirm = new interactionPolicy.Prompt({ name: 'confirm', requestable: true });

basePolicy.add(promptReset);
basePolicy.add(promptCreate);
basePolicy.add(promptConfirm);

(async () => {
    if (ENVIRONMENT !== 'test') {
        await MongoAdapter.connect();
    }
})().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});

// Configuration defaults:
// https://github.com/panva/node-oidc-provider/blob/master/lib/helpers/defaults.js
export default {
    debug: false,
    jwks,
    adapter: MongoAdapter,
    async findAccount(ctx: any, id: string) {
        const account: AccountDocument = await Account.findById(id);

        return {
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    ...account,
                };
            },
        };
    },
    routes: {
        authorization: '/auth',
        backchannel_authentication: '/backchannel',
        code_verification: '/device',
        device_authorization: '/device/auth',
        end_session: '/session/end',
        introspection: '/token/introspection',
        jwks: '/jwks',
        pushed_authorization_request: '/request',
        registration: '/reg',
        revocation: '/token/revocation',
        token: '/token',
        userinfo: '/me',
    },
    extraParams: [
        'signup_email',
        'return_url',
        'signup_token',
        'authentication_token',
        'secure_key',
        'password_reset_token',
        'prompt',
    ],
    scopes: [
        'account:read', // admin
        'account:write', // admin (only active and signupped users)
        'asset_pools:read', // user, dashboard, admin
        'asset_pools:write', // user, dashboard, admin
        'rewards:read', // user, dashboard, admin
        'rewards:write', // dashboard
        'members:read', // admin
        'members:write', // admin
        'withdrawals:read', // user
        'withdrawals:write', // admin
        'metrics:read', // cms
    ],
    claims: {
        openid: ['sub', 'email', 'address'],
        admin: ['admin'], // Deprecates soon and will move to permissions scheme
        cms: ['cms'], // Deprecates soon and will move to permissions scheme
        dashboard: ['dashboard'], // Deprecates soon and will move to permissions scheme
        user: ['user'], // Deprecates soon and will move to permissions scheme
        widget: ['widget', 'address'], // Deprecates soon and will move to permissions scheme
        email: ['email'],
    },
    ttl: {
        AccessToken: 1 * 60 * 60, // 1 hour in seconds
        AuthorizationCode: 10 * 60, // 10 minutes in seconds
        ClientCredentials: 10 * 60, // 10 minutes in seconds
    },
    formats: {
        AccessToken: 'jwt',
        AuthorizationCode: 'jwt',
        ClientCredentials: 'jwt',
    },
    interactions: {
        policy: basePolicy,
        url(ctx: any) {
            return `/oidc/${ctx.oidc.uid}`;
        },
    },
    features: {
        devInteractions: { enabled: false },
        clientCredentials: { enabled: true },
        encryption: { enabled: true },
        introspection: { enabled: true },
        registration: { enabled: true, initialAccessToken: INITIAL_ACCESS_TOKEN },
        registrationManagement: { enabled: true },
        rpInitiatedLogout: {
            enabled: true,
            logoutSource: async (ctx: any, form: any) => {
                ctx.body = `<!DOCTYPE html>
                <head>
                <title>Logout</title>
                </head>
                <body>
                ${form}
                <script>
                    function logout() {
                    var form = document.forms[0];
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'logout';
                    input.value = 'yes';
                    form.appendChild(input);
                    form.submit();
                    }
                    logout()
                </script>
                </body>
                </html>`;
            },
        },
    },
    cookies: {
        long: { signed: true, maxAge: 1 * 24 * 60 * 60 * 1000 },
        short: { signed: true },
        keys: [SECURE_KEY.split(',')[0], SECURE_KEY.split(',')[1]],
    },
    async renderError(ctx: any, error: any) {
        ctx.type = 'html';
        ctx.body = `<!DOCTYPE html>
        <head>
        <title>Oops! Something went wrong...</title>
        </head>
        <body>
        <h1>Oops! something went wrong</h1>
        <pre>${JSON.stringify(error, null, 4)}</pre>
        </body>
        </html>`;
    },
};

import MongoAdapter from '../util/adapter';
import { Account } from '../models/Account';
import { AccountDocument } from '../models/Account';
import { INITIAL_ACCESS_TOKEN, SECURE_KEY } from '../util/secrets';
import { interactionPolicy } from 'oidc-provider';
import { getJwks } from '../util/jwks';

const basePolicy = interactionPolicy.base();
const promptReset = new interactionPolicy.Prompt({ name: 'reset', requestable: true });
const promptCreate = new interactionPolicy.Prompt({ name: 'create', requestable: true });
const promptConfirm = new interactionPolicy.Prompt({ name: 'confirm', requestable: true });
const promptConnect = new interactionPolicy.Prompt({ name: 'connect', requestable: true });
const promptAccount = new interactionPolicy.Prompt({ name: 'account-settings', requestable: true });
const promtotp = new interactionPolicy.Prompt({ name: 'totp-setup', requestable: true });

basePolicy.add(promptCreate);
basePolicy.add(promptConfirm);
basePolicy.add(promptConnect);
basePolicy.add(promptReset);
basePolicy.add(promptAccount);
basePolicy.add(promtotp);

// Configuration defaults:
// https://github.com/panva/node-oidc-provider/blob/master/lib/helpers/defaults.js

export default {
    debug: false,
    jwks: getJwks(),
    adapter: MongoAdapter,
    async findAccount(ctx: any, id: string) {
        const account: AccountDocument = await Account.findById(id);

        return {
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    ...account.toJSON(),
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
        'reward_hash',
        'signup_email',
        'return_url',
        'signup_token',
        'authentication_token',
        'secure_key',
        'password_reset_token',
        'prompt',
        'channel',
    ],
    scopes: [
        'account:read',
        'account:write',
        'pools:read',
        'pools:write',
        'rewards:read',
        'rewards:write',
        'members:read',
        'members:write',
        'memberships:read',
        'memberships:write',
        'withdrawals:read',
        'withdrawals:write',
        'deposits:read',
        'deposits:write',
        'erc20:read',
        'erc20:write',
        'erc721:read',
        'erc721:write',
        'promotions:read',
        'promotions:write',
        'transactions:read',
        'transactions:write',
        'payments:read',
        'payments:write',
        'widgets:write',
        'widgets:read',
        'relay:write',
        'metrics:read',
        'swaprule:read',
        'swaprule:write',
        'swap:read',
        'swap:write',
        'claims:write',
        'claims:read',
        'brands:read',
        'brands:write',
        'offline_access',
    ],
    claims: {
        openid: ['sub', 'email'],
    },
    issueRefreshToken: async (ctx: any, client: any, code: any) => {
        if (!client.grantTypeAllowed('refresh_token')) {
            return false;
        }
        return (
            code.scopes.has('offline_access') ||
            (client.applicationType === 'web' && client.tokenEndpointAuthMethod === 'none')
        );
    },
    ttl: {
        //AccessToken: 15,
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
                <script src="/js/logout.js"></script>
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

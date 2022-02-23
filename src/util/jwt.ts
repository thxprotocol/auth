import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { ISSUER } from '../util/secrets';
import { getJwks } from './jwks';

export const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: '', // Unnecessary, keys are provided through getKeysInterceptor.
        getKeysInterceptor: () => {
            return getJwks().keys;
        },
    }),
    issuer: ISSUER,
    algorithms: ['RS256'],
});

export function parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
            .toString('binary')
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(''),
    );

    return JSON.parse(jsonPayload);
}

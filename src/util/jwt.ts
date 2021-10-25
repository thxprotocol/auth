import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { ISSUER, AUTH_URL } from '../util/secrets';

export const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${AUTH_URL}/jwks`,
    }),
    issuer: ISSUER,
    algorithms: ['RS256'],
});

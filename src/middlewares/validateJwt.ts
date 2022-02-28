import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { ISSUER } from '../util/secrets';
import { getJwks } from '../util/jwks';

export const validateJwt = jwt({
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

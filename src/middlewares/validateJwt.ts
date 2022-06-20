import jwksRsa from 'jwks-rsa';
import expressJwtPermissions from 'express-jwt-permissions';
import { expressjwt } from 'express-jwt';
import { ISSUER } from '../util/secrets';
import { getJwks } from '../util/jwks';

export const validateJwt = expressjwt({
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

export const guard = expressJwtPermissions({ requestProperty: 'auth', permissionsProperty: 'scope' });

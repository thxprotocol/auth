import Provider from 'oidc-provider';
import configuration from './config';
import { NODE_ENV, ISSUER, SECURE_KEY } from '../../util/secrets';

const oidc = new Provider(ISSUER, configuration as any); // Configuration

oidc.proxy = true;
oidc.keys = SECURE_KEY.split(',');

if (NODE_ENV !== 'production') {
    const { invalidate: orig } = (oidc.Client as any).Schema.prototype;
    (oidc.Client as any).Schema.prototype.invalidate = function invalidate(message: any, code: any) {
        if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') return;
        orig.call(this, message);
    };
}

export { oidc };

import { ENVIRONMENT } from './secrets';

export function allowedHosts() {
    return ['thx.network', /.*\.thx\.network$/].concat(
        ENVIRONMENT !== 'development' && ENVIRONMENT !== 'production'
            ? ['localhost:3030', 'localhost:3000', 'auth_node:3030', 'api_node:3030', /127.0.0.1:*/]
            : [],
    );
}

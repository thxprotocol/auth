import db from '../../src/util/database';
import MongoAdapter from '../../src/controllers/oidc/adapter';

beforeAll(async () => {
    await MongoAdapter.connect();
});

afterAll(async () => {
    await db.disconnect();
});

require('./account.ts');
require('./grants.ts');
require('./signin.ts');
require('./signup.ts');

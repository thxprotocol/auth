import mongoose from 'mongoose';
import db from '../../src/util/database';
import MongoAdapter from '../../src/controllers/oidc/adapter';
import server from '../../src/server';

beforeAll(async () => {
    await MongoAdapter.connect();
});

afterAll(async () => {
    await db.disconnect();
    await mongoose.disconnect();
    await server.close();
});

require('./account.ts');
require('./grants.ts');
require('./signin.ts');
require('./signup.ts');

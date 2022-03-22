import Airtable from 'airtable';
import db from '../src/util/database';
import { Account } from '../src/models/Account';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, MONGODB_URI } from '../src/util/secrets';

const migrate = async () => {
    db.connect(MONGODB_URI);
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const query = Account.find();

    for await (const account of query) {
        const date = new Date(account.createdAt);
        try {
            await base('Pipeline: Signups').create({
                Email: account.email,
                Date: date.getMonth() + '/' + (date.getDay() + 1) + '/' + date.getFullYear(),
            });
        } catch (e) {
            console.log(e);
        }
    }
};

migrate();

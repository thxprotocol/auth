
module.exports = {
    async up(db) {
        // ADMIN SCOPE
        let oldScope = 'openid admin';
        let newScope = 'openid account:read account:write asset_pools:read asset_pools:write rewards:read members:read members:write withdrawals:write';
        db.collection('client').updateMany({ 'payload.scope': oldScope }, { $set: { 'payload.scope': newScope }});

        // DASHBOARD SCOPE
        oldScope = 'openid user dashboard';
        newScope = 'openid asset_pools:read asset_pools:write withdrawals:read rewards:write deposits:read deposits:write promotions:read promotions:write';
        db.collection('client').updateMany({ 'payload.scope': oldScope }, { $set: { 'payload.scope': newScope }});

        // CMS SCOPE
        oldScope = 'openid cms';
        newScope = 'openid metrics:read';
        db.collection('client').updateMany({ 'payload.scope': 'openid cms' }, { $set: { 'payload.scope': newScope }});

        // WALLET SCOPE
        oldScope = 'openid user email offline_access deposits:read deposits:write'
        newScope = 'openid email offline_access deposits:read deposits:write asset_pools:read asset_pools:write rewards:read withdrawals:read';
        db.collection('client').updateMany({ 'payload.scope': oldScope }, { $set: { 'payload.scope': newScope }});
    }
};

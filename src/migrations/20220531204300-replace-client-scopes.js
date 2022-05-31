
module.exports = {
    async up(db) {
        const newAdminScope = 'openid account:read account:write asset_pools:read asset_pools:write rewards:read members:read members:write withdrawals:write';
        db.collection('client').updateMany({ 'payload.scope': 'openid admin' }, { $set: { 'payload.scope': newAdminScope }});

        const newUserDashBoardScope = 'openid asset_pools:read asset_pools:write withdrawals:read rewards:write deposits:read deposits:write';
        db.collection('client').updateMany({ 'payload.scope': 'openid user dashboard' }, { $set: { 'payload.scope': newUserDashBoardScope }});

        const newUserCMSScope = 'openid metrics:read';
        db.collection('client').updateMany({ 'payload.scope': 'openid cms' }, { $set: { 'payload.scope': newUserCMSScope }});
    }
};

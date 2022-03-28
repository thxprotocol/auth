import { Request, Response } from '../../../types/request';
import { AccountService } from '../../../services/AccountService';
import airtable from '../../../util/airtable';
import { DASHBOARD_URL } from '../../../util/secrets';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;
    const { error, result, account } = await AccountService.verifySignupToken(params.signup_token);

    if (result) {
        const shouldAddUser = (params.return_url || '').includes(DASHBOARD_URL);
        if (!shouldAddUser) return;

        await airtable.pipelineSignup({
            Email: account.email,
            Date: account.createdAt,
            AcceptUpdates: account.acceptUpdates,
        });
    }

    return res.render('confirm', {
        uid,
        params,
        alert: {
            variant: error ? 'danger' : 'success',
            message: error || result,
        },
    });
}

export default { controller };

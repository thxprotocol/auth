import { Request, Response } from '../../../types/request';
import { AccountService } from '../../../services/AccountService';

async function controller(req: Request, res: Response) {
    const { uid, params, alert, session } = req.interaction;
    const account = await AccountService.get(session.accountId);

    return res.render('account', {
        uid,
        alert,
        params: {
            ...params,
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            organisation: account.organisation,
            address: account.address,
            plan: account.plan,
            otpSecret: account.otpSecret,
        },
    });
}

export default { controller };

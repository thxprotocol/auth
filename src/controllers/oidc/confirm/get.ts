import { Request, Response } from '../../../types/request';
import { AccountService } from '../../../services/AccountService';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;

    const { error, result } = await AccountService.verifySignupToken(params.signup_token);

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

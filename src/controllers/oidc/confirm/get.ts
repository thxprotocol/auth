import { Request, Response } from 'express';
import { AccountService } from '../../../services/AccountService';
import { oidc } from '../../../util/oidc';

async function controller(req: Request, res: Response) {
    const interaction = await oidc.interactionDetails(req, res);
    if (!interaction) throw new Error('Could not find the interaction.');
    const { uid, params } = interaction;

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

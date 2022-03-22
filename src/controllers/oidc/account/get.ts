import { Request, Response } from 'express';
import { AccountService } from '../../../services/AccountService';
import { authenticator } from '@otplib/preset-default';
import { oidc } from '../../../util/oidc';

async function controller(req: Request, res: Response) {
    const interaction = await oidc.interactionDetails(req, res);
    if (!interaction) throw new Error('Could not find the interaction.');

    const { uid, params } = interaction;
    const account = await AccountService.get(interaction.session.accountId);

    let otpSecret = account.otpSecret;
    if (!otpSecret) {
        otpSecret = authenticator.generateSecret();
    }

    return res.render('account', {
        uid,
        params: {
            ...params,
            otpSecret,
            email: account.email,
            first_name: account.firstName,
            last_name: account.lastName,
            organisation: account.organisation,
            address: account.address,
            plan: account.plan,
            mfaEnable: account.otpSecret,
        },
    });
}

export default { controller };

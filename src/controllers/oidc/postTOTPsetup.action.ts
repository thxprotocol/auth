import { Request, Response } from 'express';
import { authenticator } from '@otplib/preset-default';

import { AccountService } from '../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../util/messages';
import { getInteraction } from './utils';

export default async function getTOTPSetupCallback(req: Request, res: Response) {
    async function getAccountBySub(sub: string) {
        const account = await AccountService.get(sub);
        if (!account) throw new Error(ERROR_NO_ACCOUNT);
        return account;
    }

    const uid = req.body.uid as string;
    const error = req.query.error as string;

    if (error) return res.redirect(`/oidc/${uid}`);

    // Get all token information
    const interaction = await getInteraction(uid);

    // Check if there is an active session for this interaction
    if (!interaction.session) {
        throw new Error('You have to login before do this action.');
    }

    const account = await getAccountBySub(interaction.session.accountId);

    if (account.otpSecret) {
        if (req.body.disable) {
            account.otpSecret = null;
            await account.save();
            return res.render('totp', { uid, params: { ...req.body } });
        }
        throw new Error('You already have MFA setup.');
    }

    const isValid = authenticator.check(req.body.code, req.body.secret);

    if (!isValid) {
        return res.render('totp', { uid, params: { ...req.body, error: 'The code you input is incorrect' } });
    }

    account.otpSecret = req.body.secret;
    account.save();

    return res.redirect(interaction.params.return_url);
}

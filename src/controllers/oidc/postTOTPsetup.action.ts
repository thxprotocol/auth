import { Request, Response } from 'express';
import qrcode from 'qrcode';

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
    const alert = { variant: 'danger', message: '' };

    if (error) return res.redirect(`/oidc/${uid}`);

    // Get all token information
    const interaction = await getInteraction(uid);

    // Check if there is an active session for this interaction
    if (!interaction.session) {
        alert.message = 'You have to login before do this action.';
        return res.render('totp', {
            uid,
            params: { ...req.body, alert },
        });
    }

    const account = await getAccountBySub(interaction.session.accountId);

    if (account.otpSecret) {
        if (req.body.disable) {
            account.otpSecret = null;
            await account.save();
            return res.render('account', {
                uid,
                params: { ...req.body, mfaEnable: false },
            });
        }
        alert.message = 'You already have MFA setup.';
        return res.render('totp', {
            uid,
            params: { ...req.body, alert },
        });
    }

    const otpauth = authenticator.keyuri(account.email, 'thx', req.body.otpSecret);
    const code = await qrcode.toDataURL(otpauth);

    console.log(req.body);
    if (!req.body.code) {
        return res.render('totp', { uid, params: { ...req.body, qr_code: code, alert } });
    }

    const isValid = authenticator.check(req.body.code, req.body.otpSecret);
    console.log(isValid);
    if (!isValid) {
        alert.message = 'The code you input is incorrect';
        return res.render('totp', {
            uid,
            params: { ...req.body, qr_code: code, alert },
        });
    }

    account.otpSecret = req.body.otpSecret;
    account.save();

    return res.render('account', {
        uid,
        params: { ...req.body, mfaEnable: account.otpSecret },
    });
}

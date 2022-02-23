import { Request, Response } from 'express';
import AccountService from '../../services/AccountService';
import { GTM } from '../../util/secrets';
import MailService from '../../services/MailService';

export default async function postForgotController(req: Request, res: Response) {
    const account = await AccountService.getByEmail(req.body.email);

    // This leaks email adresses which are registered, consider failing silently..
    if (!account) {
        return res.render('forgot', {
            uid: req.params.uid,
            params: {
                return_url: req.body.returnUrl,
            },
            alert: { variant: 'danger', message: 'An account with this e-mail address not exists.' },
            gtm: GTM,
        });
    }

    await MailService.sendResetPasswordEmail(account, req.body.returnUrl, req.params.uid);

    return res.render('forgot', {
        uid: req.params.uid,
        params: {
            return_url: req.body.returnUrl,
        },
        alert: {
            variant: 'success',
            message: 'We have send a password reset link to ' + account.email + '. It will be valid for 20 minutes.',
        },
        gtm: GTM,
    });
}

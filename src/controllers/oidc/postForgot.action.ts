import { Request, Response, NextFunction } from 'express';
import AccountService from '../../services/AccountService';
import { HttpError } from '../../models/Error';
import { GTM } from '../../util/secrets';
import MailService from '../../services/MailService';
import { ERROR_SENDING_FORGOT_MAIL_FAILED } from '../../util/messages';

export default async function postForgotController(req: Request, res: Response, next: NextFunction) {
    const { account, error } = await AccountService.getByEmail(req.body.email);
    const alert = { variant: 'danger', message: '' };

    if (!account) {
        alert.message = 'An account with this e-mail address not exists.';
    } else if (error) {
        alert.message = 'Could not check your e-mail address for existence.';
    }

    if (alert.message) {
        return res.render('forgot', {
            uid: req.params.uid,
            params: {
                return_url: req.body.returnUrl,
            },
            alert,
            gtm: GTM,
        });
    }

    try {
        const { error } = await MailService.sendResetPasswordEmail(account, req.body.returnUrl, req.params.uid);

        if (error) {
            throw new Error(ERROR_SENDING_FORGOT_MAIL_FAILED);
        }

        try {
            return res.render('forgot', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                },
                alert: {
                    variant: 'success',
                    message:
                        'We have send a password reset link to ' + account.email + '. It will be valid for 20 minutes.',
                },
                gtm: GTM,
            });
        } catch (error) {
            return next(new HttpError(502, error.toString(), error));
        }
    } catch (error) {
        return next(new HttpError(502, error.toString(), error));
    }
}

import { Request, Response, NextFunction } from 'express';
import MailService from '../../services/MailService';
import { ERROR_SENDING_MAIL_FAILED } from '../../util/messages';
import AccountService from '../../services/AccountService';
import { GTM } from '../../util/secrets';
import { HttpError } from '../../models/Error';

export default async function postCreateController(req: Request, res: Response, next: NextFunction) {
    const { result, error } = await AccountService.isEmailDuplicate(req.body.email);
    const alert = { variant: 'danger', message: '' };

    if (result) {
        alert.message = 'An account with this e-mail address already exists.';
    } else if (error) {
        alert.message = 'Could not check your e-mail address for duplicates.';
    } else if (req.body.password !== req.body.confirmPassword) {
        alert.message = 'The provided passwords are not identical.';
    } else if (!req.body.acceptTermsPrivacy) {
        alert.message = 'Please accept the terms of use and privacy statement.';
    }

    if (alert.message) {
        return res.render('signup', {
            uid: req.params.uid,
            params: {
                return_url: req.body.returnUrl,
                signup_email: req.body.email,
            },
            alert,
            gtm: GTM,
            layout: './layouts/signup-layout',
        });
    }

    const account = await AccountService.signup(
        req.body.email,
        req.body.password,
        req.body.acceptTermsPrivacy,
        req.body.acceptUpdates,
    );

    try {
        const { error } = await MailService.sendConfirmationEmail(account, req.body.returnUrl);

        if (error) {
            throw new Error(ERROR_SENDING_MAIL_FAILED);
        }

        try {
            return res.render('signup', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                    signup_email: req.body.email,
                },
                alert: {
                    variant: 'success',
                    message:
                        'Verify your e-mail address by clicking the link we just sent you. You can close this window.',
                },
                gtm: GTM,
                layout: './layouts/signup-layout',
            });
        } catch (error) {
            return next(new HttpError(502, error.toString(), error));
        }
    } catch (error) {
        return next(new HttpError(502, error.toString(), error));
    }
}

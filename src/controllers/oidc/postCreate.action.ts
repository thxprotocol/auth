import { Request, Response } from 'express';
import MailService from '../../services/MailService';
import AccountService from '../../services/AccountService';
import { checkPasswordStrength } from '../../util/passwordcheck';

export default async function postCreateController(req: Request, res: Response) {
    const isDuplicate = await AccountService.isEmailDuplicate(req.body.email);
    const alert = { variant: 'danger', message: '' };
    const passwordStrength = checkPasswordStrength(req.body.password);

    if (isDuplicate) {
        alert.message = 'An account with this e-mail address already exists.';
    } else if (passwordStrength != 'strong') {
        alert.message = 'Please enter a strong password.';
    } else if (req.body.password !== req.body.confirmPassword) {
        alert.message = 'The provided passwords are not identical.';
    } else if (req.body.acceptTermsPrivacy !== 'true') {
        alert.message = 'Please accept the terms of use and privacy statement.';
    } else if (!req.body.email?.length) {
        alert.message = 'Email cannot be blank.';
    }

    if (alert.message) {
        return res.render('signup', {
            uid: req.params.uid,
            params: {
                return_url: req.body.returnUrl,
                signup_email: req.body.email,
            },
            alert,
        });
    }

    const account = await AccountService.signup(
        req.body.email,
        req.body.password,
        req.body.acceptTermsPrivacy,
        req.body.acceptUpdates,
    );

    await MailService.sendConfirmationEmail(account, req.body.returnUrl);

    return res.render('signup', {
        uid: req.params.uid,
        params: {
            return_url: req.body.returnUrl,
            signup_email: req.body.email,
        },
        alert: {
            variant: 'success',
            message: 'Verify your e-mail address by clicking the link we just sent you. You can close this window.',
        },
    });
}

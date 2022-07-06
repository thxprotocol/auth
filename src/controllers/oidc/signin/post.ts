import { AccountService } from '../../../services/AccountService';
import { MailService } from '../../../services/MailService';
import { Request, Response } from 'express';
import { ERROR_ACCOUNT_NOT_ACTIVE, ERROR_AUTH_LINK, OTP_CODE_INVALID } from '../../../util/messages';
import { oidc } from '../../../util/oidc';
import { authenticator } from '@otplib/preset-default';

async function controller(req: Request, res: Response) {
    function renderLogin(errorMessage: string) {
        return res.render('signin', {
            uid: req.params.uid,
            params: { return_url: req.body.returnUrl },
            alert: {
                variant: 'danger',
                message: errorMessage,
            },
        });
    }

    let sub;
    try {
        sub = await AccountService.getSubForCredentials(req.body.email, req.body.password);
    } catch (error) {
        return renderLogin(error.toString());
    }

    const account = await AccountService.get(sub);

    // Make sure to send a new confirmation email for inactive accounts
    if (!account.active) {
        await MailService.sendConfirmationEmail(account, req.body.returnUrl);
        return renderLogin(ERROR_ACCOUNT_NOT_ACTIVE);
    }

    // Serve MFA views
    if (account.otpSecret) {
        // Show signin with code field for this account
        if (!req.body.code) {
            return res.render('signin', {
                uid: req.params.uid,
                params: { return_url: req.body.returnUrl, ...req.body, mfaEnabled: true },
            });
        }
        // Show signin with code field for this account
        const isValid = authenticator.check(req.body.code, account.otpSecret);
        if (!isValid) {
            return res.render('signin', {
                uid: req.params.uid,
                params: { return_url: req.body.returnUrl, ...req.body, mfaEnabled: true },
                alert: {
                    variant: 'danger',
                    message: OTP_CODE_INVALID,
                },
            });
        }
    }

    // Make sure to ask for a login link from the authority if custodial key is found
    if (account.privateKey) {
        return renderLogin(ERROR_AUTH_LINK);
    }

    // Actions after successfully login
    await AccountService.update(account, {
        lastLoginAt: Date.now(),
    });

    // Make to finish the interaction and login with sub
    return await oidc.interactionFinished(req, res, { login: { accountId: sub } }, { mergeWithLastSubmission: false });
}

export default { controller };

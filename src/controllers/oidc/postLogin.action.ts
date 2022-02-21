import AccountService from '../../services/AccountService';
import MailService from '../../services/MailService';
import { Request, Response } from 'express';
import { GTM } from '../../util/secrets';
import { ERROR_AUTH_LINK } from '../../util/messages';
import { ERROR_ACCOUNT_NOT_ACTIVE } from '../../util/messages';
import { oidc } from '.';
import { AccountDocument } from '../../models/Account';

export default async function postLoginController(req: Request, res: Response) {
    async function getSubForCredentials(email: string, password: string) {
        const { sub, error } = await AccountService.getSubForCredentials(email, password);
        if (error) throw new Error(error.message);
        return sub;
    }

    async function sendConfirmationEmail(account: AccountDocument, returnUrl: string) {
        const { result, error } = await MailService.sendConfirmationEmail(account, returnUrl);
        if (error) throw new Error(error.message);
        return result;
    }

    try {
        const sub = await getSubForCredentials(req.body.email, req.body.password);
        const account = await AccountService.get(sub);

        // Make sure to send a new confirmation email for inactive accounts
        if (!account.active) {
            if (await sendConfirmationEmail(account, req.body.returnUrl)) {
                throw new Error(ERROR_ACCOUNT_NOT_ACTIVE);
            }
        }

        // Make sure to ask for a login link from the authority if custodial key is found
        if (account.privateKey) {
            throw new Error(ERROR_AUTH_LINK);
        }

        // Make to finish the interaction and login with sub
        await oidc.interactionFinished(req, res, { login: { account: sub } }, { mergeWithLastSubmission: true });
    } catch (error) {
        return res.render('login', {
            uid: req.params.uid,
            params: { return_url: req.body.returnUrl },
            alert: {
                variant: 'danger',
                message: error.toString(),
            },
            gtm: GTM,
        });
    }
}

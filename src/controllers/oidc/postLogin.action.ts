import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { GTM } from '../../util/secrets';
import AccountService from '../../services/AccountService';
import { ERROR_NO_ACCOUNT } from '../../util/messages';
import { ERROR_AUTH_LINK } from '../../util/messages';
import { ERROR_ACCOUNT_NOT_ACTIVE } from '../../util/messages';
import MailService from '../../services/MailService';
import { oidc } from '.';

export default async function postLoginController(req: Request, res: Response, next: NextFunction) {
    async function getAccount(sub: string) {
        const { account, error } = await AccountService.get(sub);
        if (error) throw new Error(error.message);
        return account;
    }

    try {
        const { sub, error } = await AccountService.getSubForCredentials(req.body.email, req.body.password);
        const alert = {
            variant: 'danger',
            message: '',
        };

        if (error) {
            alert.message = error.toString();
        }

        const account = await getAccount(sub);
        if (!account) {
            alert.message = ERROR_NO_ACCOUNT;
        }

        if (account && !account.active) {
            const { result, error } = await MailService.sendConfirmationEmail(account, req.body.returnUrl);

            if (error) {
                alert.message = error.toString();
            }

            if (result) {
                alert.message = ERROR_ACCOUNT_NOT_ACTIVE;
            }
        }

        if (account && account.privateKey) {
            alert.message = ERROR_AUTH_LINK;
        }

        if (alert.message) {
            return res.render('login', {
                uid: req.params.uid,
                params: {},
                alert,
                gtm: GTM,
            });
        } else {
            await oidc.interactionFinished(
                req,
                res,
                {
                    login: {
                        account: sub,
                    },
                },
                { mergeWithLastSubmission: true },
            );
        }
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
    }
}

import { Request, Response, NextFunction } from 'express';
import { IAccountUpdates } from '../../models/Account';
import { HttpError } from '../../models/Error';
import AccountService from '../../services/AccountService';
import { oidc } from '.';
import { GTM } from '../../util/secrets';

export default async function postPasswordController(req: Request, res: Response, next: NextFunction) {
    try {
        const alert = { variant: 'danger', message: '' };
        if (!req.body.acceptTermsPrivacy) {
            alert.message = 'Please accept the terms of use and privacy statement.';
        }
        if (alert.message) {
            return res.render('login', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                    authentication_token: req.body.authenticationToken,
                    secure_key: req.body.secureKey,
                },
                alert,
                gtm: GTM,
            });
        }

        const { sub, error } = await AccountService.getSubForAuthenticationToken(
            req.body.password,
            req.body.passwordConfirm,
            req.body.authenticationToken,
            req.body.secureKey,
        );

        if (error) {
            return res.render('login', {
                uid: req.params.uid,
                params: {
                    return_url: req.body.returnUrl,
                    authentication_token: req.body.authenticationToken,
                    secure_key: req.body.secureKey,
                },
                alert: {
                    variant: 'danger',
                    message: error.toString(),
                },
                gtm: GTM,
            });
        } else {
            const { account } = await AccountService.get(sub);
            const updates: IAccountUpdates = {
                acceptTermsPrivacy: req.body.acceptTermsPrivacy,
                acceptUpdates: req.body.acceptUpdates,
            };

            await AccountService.update(account, updates);
        }

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
    } catch (error) {
        return next(new HttpError(500, error.toString(), error));
    }
}

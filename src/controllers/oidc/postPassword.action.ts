import { Request, Response } from 'express';
import { IAccountUpdates } from '../../models/Account';
import AccountService from '../../services/AccountService';
import { oidc } from '.';
import { GTM } from '../../util/secrets';

export default async function postPasswordController(req: Request, res: Response) {
    if (!req.body.acceptTermsPrivacy) {
        return res.render('login', {
            uid: req.params.uid,
            params: {
                return_url: req.body.returnUrl,
                authentication_token: req.body.authenticationToken,
                secure_key: req.body.secureKey,
            },
            alert: { variant: 'danger', message: 'Please accept the terms of use and privacy statement.' },
            gtm: GTM,
        });
    }

    let sub;
    try {
        sub = await AccountService.getSubForAuthenticationToken(
            req.body.password,
            req.body.passwordConfirm,
            req.body.authenticationToken,
            req.body.secureKey,
        );
    } catch (error) {
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
    }
    const account = await AccountService.get(sub);
    const updates: IAccountUpdates = {
        acceptTermsPrivacy: req.body.acceptTermsPrivacy,
        acceptUpdates: req.body.acceptUpdates,
    };

    await AccountService.update(account, updates);

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

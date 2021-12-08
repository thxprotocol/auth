import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { GTM } from '../../util/secrets';
import AccountService from '../../services/AccountService';
import { oidc } from '.';
import { googleLoginUrl } from '../../util/google';

export default async function getController(req: Request, res: Response, next: NextFunction) {
    try {
        const { uid, prompt, params } = await oidc.interactionDetails(req, res);

        console.log(prompt, params);

        let view, alert;
        switch (prompt.name || params.prompt) {
            case 'confirm': {
                view = 'confirm';
                const { error } = await AccountService.verifySignupToken(params.signup_token);

                if (error) {
                    alert = {
                        variant: 'danger',
                        message: error,
                    };
                }

                break;
            }
            case 'reset': {
                view = 'reset';
                break;
            }
            case 'create': {
                view = 'signup';
                break;
            }
            case 'consent': {
                const consent: any = {};

                consent.rejectedScopes = [];
                consent.rejectedClaims = [];
                consent.replace = false;

                const result = { consent };

                return await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            }
            case 'login': {
                view = 'login';
                break;
            }
        }

        res.render(view, {
            uid,
            params: { ...params, googleLoginUrl },
            alert,
            gtm: GTM,
        });
    } catch (err) {
        return next(new HttpError(500, 'Loading view failed.', err));
    }
}

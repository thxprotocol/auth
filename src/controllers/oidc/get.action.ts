import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import { GTM } from '../../util/secrets';
import AccountService from '../../services/AccountService';
import { oidc } from '.';
import { googleLoginUrl } from '../../util/google';
import { ChannelType, ChannelAction } from '../../models/Reward';

export default async function getController(req: Request, res: Response, next: NextFunction) {
    try {
        const { uid, prompt, params } = await oidc.interactionDetails(req, res);

        let view, alert;
        switch (prompt.name || params.prompt) {
            case 'connect': {
                if (uid) {
                    return res.redirect(`${googleLoginUrl}&state=${uid}`);
                }
                break;
            }
            case 'create': {
                view = 'signup';
                break;
            }
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
            case 'login': {
                if (!params.reward_hash) {
                    view = 'login';
                } else {
                    view = 'claim';
                    params.rewardData = JSON.parse(Buffer.from(params.reward_hash, 'base64').toString());
                    params.channelType = ChannelType[params.rewardData.rewardCondition.channelType];
                    params.channelAction = ChannelAction[params.rewardData.rewardCondition.channelType];
                }

                params.googleLoginUrl = googleLoginUrl;

                break;
            }
            case 'consent': {
                const consent: any = {};
                consent.rejectedScopes = [];
                consent.rejectedClaims = [];
                consent.replace = false;

                return await oidc.interactionFinished(req, res, { consent }, { mergeWithLastSubmission: true });
            }
        }

        return res.render(view, {
            uid,
            params,
            alert,
            gtm: GTM,
        });
    } catch (error) {
        return next(new HttpError(500, 'Loading view failed.', error));
    }
}

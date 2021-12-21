import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import AccountService from '../../services/AccountService';
import { oidc } from '.';
import { getGoogleLoginUrl } from '../../util/google';
import { ChannelType, ChannelAction } from '../../models/Reward';
import { getTwitterLoginURL } from '../../util/twitter';

export default async function getController(req: Request, res: Response, next: NextFunction) {
    try {
        const interaction = await oidc.interactionDetails(req, res);
        const { uid, prompt, params } = interaction;
        const googleLoginUrl = getGoogleLoginUrl(uid);
        const twitterLoginUrl = getTwitterLoginURL(uid);

        switch (params.prompt) {
            case 'create': {
                let alert;
                return res.render('signup', { uid, params, alert });
            }
            case 'confirm': {
                const { error } = await AccountService.verifySignupToken(params.signup_token);
                let alert;
                if (error) {
                    alert = {
                        variant: 'danger',
                        message: error,
                    };
                }
                return res.render('confirm', { uid, params, alert });
            }
            case 'reset': {
                return res.render('reset', { uid, params });
            }
            case 'connect': {
                const { account, error } = await AccountService.get(interaction.session.accountId);

                if (error) throw new Error(error.message);

                if (!account.googleAccessToken) {
                    return res.redirect(googleLoginUrl);
                }

                if (!account.twitterAccessToken) {
                    return res.redirect(twitterLoginUrl);
                }

                await oidc.interactionResult(
                    req,
                    res,
                    {},
                    {
                        mergeWithLastSubmission: true,
                    },
                );
                return res.redirect(params.return_url);
            }
        }

        switch (prompt.name) {
            case 'login': {
                let view, alert;
                if (!params.reward_hash) {
                    view = 'login';
                } else {
                    view = 'claim';
                    params.rewardData = JSON.parse(Buffer.from(params.reward_hash, 'base64').toString());
                    params.channelType = ChannelType[params.rewardData.rewardCondition.channelType];
                    params.channelAction = ChannelAction[params.rewardData.rewardCondition.channelAction];
                }

                params.googleLoginUrl = googleLoginUrl;
                params.twitterLoginUrl = twitterLoginUrl;

                return res.render(view, { uid, params, alert });
            }
            case 'consent': {
                const consent: any = {};
                consent.rejectedScopes = [];
                consent.rejectedClaims = [];
                consent.replace = false;

                return await oidc.interactionFinished(req, res, { consent }, { mergeWithLastSubmission: true });
            }
        }
    } catch (error) {
        return next(new HttpError(500, 'Loading view failed.', error));
    }
}

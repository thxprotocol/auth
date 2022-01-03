import { Request, Response } from 'express';
import AccountService from '../../services/AccountService';
import { oidc } from '.';
import { getGoogleLoginUrl } from '../../util/google';
import { ChannelType, ChannelAction } from '../../models/Reward';
import { getTwitterLoginURL } from '../../util/twitter';

const youtubeScope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/youtube'];
const youtubeReadOnlyScope = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/youtube.readonly',
];

function getLoginLinkForChannelAction(uid: string, channelAction: ChannelAction) {
    if (channelAction === ChannelAction.Like) {
        return getGoogleLoginUrl(uid, youtubeScope);
    }
    if (channelAction === ChannelAction.Subscribe) {
        return getGoogleLoginUrl(uid, youtubeReadOnlyScope);
    }
}

export default async function getController(req: Request, res: Response) {
    try {
        const interaction = await oidc.interactionDetails(req, res);
        if (!interaction) throw new Error('Could not find the interaction.');

        const { uid, prompt, params } = interaction;

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

                if (params.channel == ChannelType.Google && !account.googleAccessToken) {
                    const googleLoginUrl = getGoogleLoginUrl(req.params.uid, youtubeReadOnlyScope);
                    return res.redirect(googleLoginUrl);
                }

                if (params.channel == ChannelType.Twitter && !account.twitterAccessToken) {
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
                    const googleLoginUrl = getGoogleLoginUrl(req.params.uid, youtubeReadOnlyScope);
                    params.googleLoginUrl = googleLoginUrl;
                } else {
                    view = 'claim';

                    params.rewardData = JSON.parse(Buffer.from(params.reward_hash, 'base64').toString());
                    params.googleLoginUrl = getLoginLinkForChannelAction(
                        uid,
                        params.rewardData.rewardCondition.channelAction,
                    );
                    params.channelType = ChannelType[params.rewardData.rewardCondition.channelType];
                    params.channelAction = ChannelAction[params.rewardData.rewardCondition.channelAction];
                    params.channelItem = params.rewardData.rewardCondition.channelItem;
                }

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
        return res.render('error', { params: {}, alert: { variant: 'danger', message: error.message } });
    }
}

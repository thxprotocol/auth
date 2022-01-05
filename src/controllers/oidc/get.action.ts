import AccountService from '../../services/AccountService';
import { Request, Response } from 'express';
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
    switch (channelAction) {
        default:
        case ChannelAction.YouTubeLike:
            return { googleLoginUrl: getGoogleLoginUrl(uid, youtubeScope) };
        case ChannelAction.YouTubeSubscribe:
            return { googleLoginUrl: getGoogleLoginUrl(uid, youtubeReadOnlyScope) };
        case ChannelAction.TwitterLike || ChannelAction.TwitterSubscribe || ChannelAction.TwitterFollow:
            return { twitterLoginUrl: getTwitterLoginURL(uid) };
    }
}

export default async function getController(req: Request, res: Response) {
    try {
        const interaction = await oidc.interactionDetails(req, res);
        if (!interaction) throw new Error('Could not find the interaction.');

        const { uid, prompt, params } = interaction;

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
                    const twitterLoginUrl = getTwitterLoginURL(uid);
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
                    const googleLoginUrl = getGoogleLoginUrl(uid, youtubeReadOnlyScope);
                    const twitterLoginUrl = getTwitterLoginURL(uid);

                    params.googleLoginUrl = googleLoginUrl;
                    params.twitterLoginUrl = twitterLoginUrl;

                    return res.render(view, { uid, params, alert });
                } else {
                    view = 'claim';
                    const rewardData = JSON.parse(Buffer.from(params.reward_hash, 'base64').toString());

                    params.rewardData = rewardData;
                    params.channelType = ChannelType[params.rewardData.rewardCondition.channelType];
                    params.channelAction = ChannelAction[params.rewardData.rewardCondition.channelAction];
                    params.channelItem = params.rewardData.rewardCondition.channelItem;

                    return res.render(view, {
                        uid,
                        params: {
                            ...params,
                            ...getLoginLinkForChannelAction(uid, rewardData.rewardCondition.channelAction),
                        },
                        alert,
                    });
                }
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

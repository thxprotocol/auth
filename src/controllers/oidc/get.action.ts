import AccountService from '../../services/AccountService';
import { Request, Response } from 'express';
import { oidc } from '.';
import { getGoogleLoginUrl } from '../../util/google';
import { ChannelType, ChannelAction } from '../../models/Reward';
import { getTwitterLoginURL, twitterScopes } from '../../util/twitter';
import SpotifyService from '../../services/SpotifyService';
import { WALLET_URL } from '../../util/secrets';
import { SUCCESS_SIGNUP_COMPLETED } from '../../util/messages';

const youtubeScope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/youtube'];
const youtubeReadOnlyScope = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/youtube.readonly',
];

function getChannelScopes(channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
            return { channelScopes: youtubeScope };
        case ChannelAction.YouTubeSubscribe:
            return { channelScopes: youtubeReadOnlyScope };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { channelScopes: twitterScopes.split('%20') };
    }
}

function getLoginLinkForChannelAction(uid: string, channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
            return { googleLoginUrl: getGoogleLoginUrl(uid, youtubeScope) };
        case ChannelAction.YouTubeSubscribe:
            return { googleLoginUrl: getGoogleLoginUrl(uid, youtubeReadOnlyScope) };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { twitterLoginUrl: getTwitterLoginURL(uid) };
    }
}

export default async function getController(req: Request, res: Response) {
    try {
        const interaction = await oidc.interactionDetails(req, res);
        if (!interaction) throw new Error('Could not find the interaction.');

        const { uid, prompt, params } = interaction;

        // Prompt params are used for unauthenticated routes
        switch (params.prompt) {
            case 'create': {
                let alert;
                return res.render('signup', { uid, params, alert });
            }
            case 'confirm': {
                const message = await AccountService.verifySignupToken(params.signup_token);
                let alert;
                if (message != SUCCESS_SIGNUP_COMPLETED) {
                    alert = {
                        variant: 'danger',
                        message: message,
                    };
                }
                return res.render('confirm', { uid, params, alert });
            }
            case 'reset': {
                return res.render('reset', { uid, params });
            }
        }
        // Regular prompts are used for authenticated routes
        switch (prompt.name) {
            case 'connect': {
                const account = await AccountService.get(interaction.session.accountId);

                if (params.channel == ChannelType.Google && !account.googleAccessToken) {
                    const googleLoginUrl = getGoogleLoginUrl(req.params.uid, youtubeReadOnlyScope);
                    return res.redirect(googleLoginUrl);
                }

                if (params.channel == ChannelType.Twitter && !account.twitterAccessToken) {
                    const twitterLoginUrl = getTwitterLoginURL(uid);
                    return res.redirect(twitterLoginUrl);
                }

                if (params.channel == ChannelType.Spotify && !account.spotifyAccessToken) {
                    const spotifyLoginUrl = SpotifyService.getSpotifyUrl(uid);
                    return res.redirect(spotifyLoginUrl);
                }

                await oidc.interactionResult(req, res, {}, { mergeWithLastSubmission: true });

                return res.redirect(params.return_url);
            }
            case 'login': {
                if (!params.reward_hash) {
                    if (params.return_url === WALLET_URL) {
                        params.googleLoginUrl = getGoogleLoginUrl(req.params.uid, youtubeReadOnlyScope);
                        params.twitterLoginUrl = getTwitterLoginURL(uid);
                    }
                    return res.render('login', { uid, params, alert: {} });
                } else {
                    const rewardData = JSON.parse(Buffer.from(params.reward_hash, 'base64').toString());

                    params.rewardData = rewardData;

                    if (!rewardData.rewardCondition || !rewardData.rewardCondition.channelType) {
                        return res.render('login', {
                            uid,
                            params,
                            alert: {
                                variant: 'success',
                                message: `Sign in and claim your <strong>${rewardData.rewardAmount} ${rewardData.tokenSymbol}</strong>!`,
                            },
                        });
                    }

                    params.channelType = ChannelType[rewardData.rewardCondition.channelType];
                    params.channelAction = ChannelAction[rewardData.rewardCondition.channelAction];
                    params.channelItem = rewardData.rewardCondition.channelItem;

                    const scopes = getChannelScopes(rewardData.rewardCondition.channelAction);
                    const loginLink = getLoginLinkForChannelAction(uid, rewardData.rewardCondition.channelAction);

                    return res.render('claim', {
                        uid,
                        params: {
                            ...params,
                            ...scopes,
                            ...loginLink,
                        },
                        alert: {},
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

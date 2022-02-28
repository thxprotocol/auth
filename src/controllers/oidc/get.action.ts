import { AccountService } from '../../services/AccountService';
import { Request, Response } from 'express';
import { oidc } from '.';
import { ChannelType, ChannelAction } from '../../models/Reward';
import { SpotifyService } from '../../services/SpotifyService';
import { WALLET_URL } from '../../util/secrets';
import { TwitterService } from '../../services/TwitterService';
import { YouTubeService } from '../../services/YouTubeService';

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
            return { channelScopes: TwitterService.getScopes().split('%20') };
    }
}

function getLoginLinkForChannelAction(uid: string, channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
            return { googleLoginUrl: YouTubeService.getLoginUrl(uid, youtubeScope) };
        case ChannelAction.YouTubeSubscribe:
            return { googleLoginUrl: YouTubeService.getLoginUrl(uid, youtubeReadOnlyScope) };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { twitterLoginUrl: TwitterService.getLoginURL(uid) };
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
                return res.render('signup', { uid, params });
            }
            case 'confirm': {
                const { error, result } = await AccountService.verifySignupToken(params.signup_token);

                return res.render('confirm', {
                    uid,
                    params,
                    alert: {
                        variant: error ? 'danger' : 'success',
                        message: error || result,
                    },
                });
            }
            case 'reset': {
                return res.render('reset', { uid, params });
            }
        }
        // Regular prompts are used for authenticated routes
        switch (prompt.name) {
            case 'connect': {
                const account = await AccountService.get(interaction.session.accountId);
                let redirect = '';

                if (params.channel == ChannelType.Google && !account.googleAccessToken) {
                    redirect = YouTubeService.getLoginUrl(req.params.uid, youtubeReadOnlyScope);
                } else if (params.channel == ChannelType.Twitter && !account.twitterAccessToken) {
                    redirect = TwitterService.getLoginURL(uid);
                } else if (params.channel == ChannelType.Spotify && !account.spotifyAccessToken) {
                    redirect = SpotifyService.getSpotifyUrl(uid);
                }

                if (!redirect) {
                    await oidc.interactionResult(req, res, {}, { mergeWithLastSubmission: true });
                    redirect = params.return_url;
                }

                return res.redirect(redirect);
            }
            case 'login': {
                if (!params.reward_hash) {
                    if (params.return_url === WALLET_URL) {
                        params.googleLoginUrl = YouTubeService.getLoginUrl(req.params.uid, youtubeReadOnlyScope);
                        params.twitterLoginUrl = TwitterService.getLoginURL(uid);
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

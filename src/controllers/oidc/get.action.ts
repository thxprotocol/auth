import { Request, Response } from 'express';
import { authenticator } from '@otplib/preset-default';

import { ChannelAction, ChannelType } from '../../models/Reward';
import { AccountService } from '../../services/AccountService';
import { SPOTIFY_API_SCOPE, SpotifyService } from '../../services/SpotifyService';
import { TwitterService } from '../../services/TwitterService';
import { YouTubeService } from '../../services/YouTubeService';
import { WALLET_URL } from '../../util/secrets';
import { oidc } from './';

function getChannelScopes(channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
            return { channelScopes: YouTubeService.getScope() };
        case ChannelAction.YouTubeSubscribe:
            return { channelScopes: YouTubeService.getReadOnlyScope() };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { channelScopes: TwitterService.getScopes().split('%20') };
        case ChannelAction.SpotifyPlaylistFollow:
        case ChannelAction.SpotifyTrackPlaying:
        case ChannelAction.SpotifyTrackRecent:
        case ChannelAction.SpotifyTrackSaved:
        case ChannelAction.SpotifyUserFollow:
            return { channelScopes: SPOTIFY_API_SCOPE };
    }
}

function getLoginLinkForChannelAction(uid: string, channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
            return { googleLoginUrl: YouTubeService.getLoginUrl(uid, YouTubeService.getScope()) };
        case ChannelAction.YouTubeSubscribe:
            return { googleLoginUrl: YouTubeService.getLoginUrl(uid, YouTubeService.getReadOnlyScope()) };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { twitterLoginUrl: TwitterService.getLoginURL(uid) };
        case ChannelAction.SpotifyPlaylistFollow:
        case ChannelAction.SpotifyTrackPlaying:
        case ChannelAction.SpotifyTrackRecent:
        case ChannelAction.SpotifyTrackSaved:
        case ChannelAction.SpotifyUserFollow:
            return { spotifyLoginUrl: SpotifyService.getSpotifyUrl(uid) };
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

            case 'account-settings': {
                if (!interaction.session) {
                    throw new Error('You have to login before do this action.');
                }
                const account = await AccountService.get(interaction.session.accountId);

                let otpSecret = account.otpSecret;
                if (!otpSecret) {
                    otpSecret = authenticator.generateSecret();
                }

                return res.render('account', {
                    uid,
                    params: {
                        ...params,
                        otpSecret,
                        email: account.email,
                        first_name: account.firstName,
                        last_name: account.lastName,
                        organisation: account.organisation,
                        plan: account.plan,
                        type: account.type,
                        mfaEnable: account.otpSecret,
                    },
                });
            }
        }
        // Regular prompts are used for authenticated routes
        switch (prompt.name) {
            case 'connect': {
                const account = await AccountService.get(interaction.session.accountId);
                let redirect = '';

                if (params.channel == ChannelType.Google && !account.googleAccessToken) {
                    redirect = YouTubeService.getLoginUrl(req.params.uid, YouTubeService.getReadOnlyScope());
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
                        params.googleLoginUrl = YouTubeService.getLoginUrl(
                            req.params.uid,
                            YouTubeService.getReadOnlyScope(),
                        );
                        params.twitterLoginUrl = TwitterService.getLoginURL(uid);
                        params.spotifyLoginUrl = SpotifyService.getSpotifyUrl(uid);
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

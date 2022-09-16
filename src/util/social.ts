import { TwitterService } from '../services/TwitterService';
import { YouTubeService } from '../services/YouTubeService';
import { ChannelAction } from '../models/Reward';

function getChannelScopes(channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
        case ChannelAction.YouTubeSubscribe:
            return { channelScopes: YouTubeService.getExpandedScopes() };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { channelScopes: TwitterService.getScopes() };
    }
}

function getLoginLinkForChannelAction(uid: string, channelAction: ChannelAction) {
    switch (channelAction) {
        case ChannelAction.YouTubeLike:
        case ChannelAction.YouTubeSubscribe:
            return { googleLoginUrl: YouTubeService.getLoginUrl(uid, YouTubeService.getExpandedScopes()) };
        case ChannelAction.TwitterLike:
        case ChannelAction.TwitterRetweet:
        case ChannelAction.TwitterFollow:
            return { twitterLoginUrl: TwitterService.getLoginURL(uid, {}) };
    }
}

export { getChannelScopes, getLoginLinkForChannelAction };

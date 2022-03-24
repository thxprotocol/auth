import { TwitterService } from '../services/TwitterService';
import { YouTubeService } from '../services/YouTubeService';
import { ChannelAction } from '../models/Reward';
import { SPOTIFY_API_SCOPE, SpotifyService } from '../services/SpotifyService';

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

export { getChannelScopes, getLoginLinkForChannelAction };
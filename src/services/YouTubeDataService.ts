import axios from 'axios';
import { AccountDocument } from '../models/Account';
import { getYoutubeClient, IYoutubeClient } from '../util/google';

const ERROR_NO_DATA = 'Could not find an youtube data for this accesstoken';

export default class YouTubeDataService {
    static async validateLike(account: AccountDocument, channelItem: string) {
        try {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.videos.getRating({
                id: [channelItem],
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return {
                result: r.data.items.length ? r.data.items[0].rating == 'like' : false,
            };
        } catch (error) {
            return { error };
        }
    }

    static async validateSubscribe(account: AccountDocument, channelItem: string) {
        try {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.subscriptions.list({
                forChannelId: channelItem,
                part: ['snippet'],
                mine: true,
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return {
                result: r.data.items.length > 0,
            };
        } catch (error) {
            return { error };
        }
    }

    static async getChannelList(account: AccountDocument) {
        try {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.channels.list({
                part: ['snippet'],
                mine: true,
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return {
                channels: r.data.items.map((item: any) => {
                    return {
                        id: item.id,
                        title: item.snippet.title,
                        thumbnailURI: item.snippet.thumbnails.default.url,
                    };
                }),
            };
        } catch (error) {
            return { error };
        }
    }

    static async getVideoList(account: AccountDocument) {
        async function getChannels(youtube: IYoutubeClient) {
            const r = await youtube.channels.list({
                part: ['contentDetails'],
                mine: true,
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return r.data;
        }

        async function getPlaylistItems(youtube: IYoutubeClient, id: string) {
            const r = await youtube.playlistItems.list({
                playlistId: id,
                part: ['contentDetails'],
            });
            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }
            return r.data.items;
        }

        async function getVideos(youtube: IYoutubeClient, videoIds: string[]) {
            const r = await youtube.videos.list({
                id: videoIds,
                part: ['snippet'],
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return r.data.items;
        }

        try {
            const youtube = await getYoutubeClient(account);
            const channel = await getChannels(youtube);

            if (!channel.items.length) {
                return { videos: [] };
            }

            const uploadsChannelId = channel.items[0].contentDetails.relatedPlaylists.uploads;
            const playlistItems = await getPlaylistItems(youtube, uploadsChannelId);
            const videoIds = playlistItems.map((item: any) => item.contentDetails.videoId);
            const videos = videoIds.length ? await getVideos(youtube, videoIds) : [];

            return {
                videos: videos.map((item: any) => {
                    return {
                        id: item.id,
                        title: item.snippet.title,
                        tags: item.snippet.tags,
                        thumbnailURI: item.snippet.thumbnails.default.url,
                    };
                }),
            };
        } catch (error) {
            return { error };
        }
    }

    static async revokeAccess(account: AccountDocument) {
        try {
            const r = await axios({
                url: `https://oauth2.googleapis.com/revoke?token=${account.googleAccessToken}`,
                method: 'POST',
            });

            if (r.status !== 200) throw new Error('Could not revoke access token');

            return { result: r.data };
        } catch (error) {
            return { error };
        }
    }
}

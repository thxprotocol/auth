import { AccountDocument } from '../models/Account';
import { getYoutubeClient } from '../util/google';

const ERROR_NO_DATA = 'Could not find an youtube data for this accesstoken';

export default class YouTubeDataService {
    static async validateLike(account: AccountDocument, channelItem: string) {
        try {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.videos.list({
                id: [channelItem],
                part: ['snippet', 'contentDetails', 'statistics'],
                myRating: 'like',
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return {
                result: !!r.data.items.find((item: { id: string }) => item.id === channelItem),
            };
        } catch (error) {
            return { error };
        }
    }

    static async validateSubscribe(account: AccountDocument, channelItem: string) {
        try {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.subscriptions.list({
                id: [channelItem],
                part: ['snippet', 'contentDetails', 'statistics'],
            });
        } catch (error) {
            //
        }
        return;
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

            const channels = r.data.items.map((item: any) => {
                return {
                    id: item.id,
                    title: item.snippet.title,
                    thumbnailURI: item.snippet.thumbnails.default.url,
                };
            });

            return {
                channels,
            };
        } catch (error) {
            console.log(error);
            return { error };
        }
    }

    static async getVideoList(account: AccountDocument) {
        async function getChannels() {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.channels.list({
                part: ['contentDetails'],
                mine: true,
            });

            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return r.data;
        }

        async function getPlaylistItems(id: string) {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.playlistItems.list({
                playlistId: id,
                part: ['contentDetails'],
            });
            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }
            return r.data.items;
        }

        async function getVideos(videoIds: string[]) {
            const youtube = await getYoutubeClient(account);
            const r = await youtube.videos.list({
                id: videoIds,
                part: ['snippet'],
            });
            r.data.items.map((item: any) => console.log(item.snippet));
            if (!r.data) {
                throw new Error(ERROR_NO_DATA);
            }

            return r.data.items;
        }

        try {
            const channel = await getChannels();
            const uploadsChannelId = channel.items[0].contentDetails.relatedPlaylists.uploads;
            const playlistItems = await getPlaylistItems(uploadsChannelId);
            const videoIds = playlistItems.map((item: any) => item.contentDetails.videoId);
            const videos = await getVideos(videoIds);

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
}

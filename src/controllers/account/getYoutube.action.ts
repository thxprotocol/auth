import { Response, NextFunction } from 'express';
import { AccountDocument } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';
import YouTubeDataService from '../../services/YouTubeDataService';

export const getYoutube = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getAccount() {
        const { account, error } = await AccountService.get(req.params.sub);
        if (error) throw new Error(error.message);
        return account;
    }

    async function getYouTubeChannels(account: AccountDocument) {
        const { channels, error } = await YouTubeDataService.getChannelList(account);
        if (error) throw new Error(error.message);
        return channels;
    }

    async function getYouTubeVideos(account: AccountDocument) {
        const { videos, error } = await YouTubeDataService.getVideoList(account);
        if (error) throw new Error(error.message);
        return videos;
    }

    try {
        const account = await getAccount();
        const channels = await getYouTubeChannels(account);
        const videos = await getYouTubeVideos(account);

        res.json({
            channels,
            videos,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

import { Request, Response, NextFunction } from 'express';
import { AccountDocument } from '../../../models/Account';
import { HttpError } from '../../../models/Error';
import AccountService from '../../../services/AccountService';
import YouTubeDataService from '../../../services/YouTubeDataService';

export const getYoutube = async (req: Request, res: Response, next: NextFunction) => {
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

        if (!account.googleAccessToken || !account.googleRefreshToken) {
            return res.json({ isAuthorized: false });
        }

        const channels = await getYouTubeChannels(account);
        const videos = await getYouTubeVideos(account);

        res.json({
            isAuthorized: true,
            channels,
            videos,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

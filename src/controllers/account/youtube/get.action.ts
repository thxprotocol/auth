import { Request, Response } from 'express';
import AccountService from '../../../services/AccountService';
import YouTubeDataService from '../../../services/YouTubeDataService';

export const getYoutube = async (req: Request, res: Response) => {
    const account = await AccountService.get(req.params.sub);

    if (!account.googleAccessToken || !account.googleRefreshToken) {
        return res.json({ isAuthorized: false });
    }

    const channels = await YouTubeDataService.getChannelList(account);
    const videos = await YouTubeDataService.getVideoList(account);

    res.json({
        isAuthorized: true,
        channels,
        videos,
    });
};

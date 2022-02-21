import { Request, Response } from 'express';
import AccountService from '../../../services/AccountService';
import YouTubeDataService from '../../../services/YouTubeDataService';

export const getYoutubeSubscribe = async (req: Request, res: Response) => {
    const account = await AccountService.get(req.params.sub);
    const result = await YouTubeDataService.validateSubscribe(account, req.params.item);

    res.json({
        result,
    });
};

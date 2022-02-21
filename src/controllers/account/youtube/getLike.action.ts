import { Request, Response } from 'express';
import AccountService from '../../../services/AccountService';
import YouTubeDataService from '../../../services/YouTubeDataService';

export const getYoutubeLike = async (req: Request, res: Response) => {
    const account = await AccountService.get(req.params.sub);
    const result = await YouTubeDataService.validateLike(account, req.params.item);

    res.json({
        result,
    });
};

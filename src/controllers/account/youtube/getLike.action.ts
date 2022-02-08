import { Request, Response, NextFunction } from 'express';
import { AccountDocument } from '../../../models/Account';
import { HttpError } from '../../../models/Error';
import AccountService from '../../../services/AccountService';
import YouTubeDataService from '../../../services/YouTubeDataService';

export const getYoutubeLike = async (req: Request, res: Response, next: NextFunction) => {
    async function getAccount(sub: string) {
        const { account, error } = await AccountService.get(sub);
        if (error) throw new Error(error.message);
        return account;
    }

    async function validateLike(account: AccountDocument, id: string) {
        const { result, error } = await YouTubeDataService.validateLike(account, id);
        if (error) throw new Error(error.message);
        return result;
    }

    try {
        const account = await getAccount(req.params.sub);
        const result = await validateLike(account, req.params.item);

        res.json({
            result,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

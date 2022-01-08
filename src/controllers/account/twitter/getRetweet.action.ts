import { Response, NextFunction } from 'express';
import { AccountDocument } from '../../../models/Account';
import { HttpError, HttpRequest } from '../../../models/Error';
import AccountService from '../../../services/AccountService';
import TwitterService from '../../../services/TwitterService';

export const getTwitterRetweet = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getAccount(sub: string) {
        const { account, error } = await AccountService.get(sub);
        if (error) throw new Error(error.message);
        return account;
    }

    async function validateRetweet(account: AccountDocument, id: string) {
        const { result, error } = await TwitterService.validateRetweet(account.twitterAccessToken, id);
        if (error) throw new Error(error.message);
        return result;
    }

    try {
        const account = await getAccount(req.params.sub);
        const result = await validateRetweet(account, req.params.item);

        res.json({
            result,
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

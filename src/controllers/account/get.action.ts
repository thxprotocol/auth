import { Response, NextFunction } from 'express';
import { AccountDocument } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

function formatAccountRes(account: AccountDocument) {
    return {
        id: account._id,
        address: account.address,
        googleAccessToken: account.googleAccessToken,
        googleAccessTokenExpires: account.googleAccessTokenExpires,
        // privateKey: account.privateKey, // TODO display this on /me endpoint
    };
}

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { account, error } = await AccountService.get(req.params.id);

        if (error) throw new Error(error.message);

        if (account) {
            res.send(formatAccountRes(account));
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};

export const getAccountByAddress = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { account, error } = await AccountService.getByAddress(req.params.address);

        if (error) throw new Error(error.message);

        if (account) {
            res.send(formatAccountRes(account));
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};

export const getAccountByEmail = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { account, error } = await AccountService.getByEmail(req.params.email);

        if (error) throw new Error(error.message);

        if (account) {
            res.send(formatAccountRes(account));
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};

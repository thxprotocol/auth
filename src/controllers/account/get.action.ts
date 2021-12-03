import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const getAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
        const { account, error } = await AccountService.get(req.params.id);

        if (error) throw new Error(error.message);

        if (account) {
            res.send({
                id: account._id,
                address: account.address,
            });
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
            res.send({
                id: account._id,
                address: account.address,
            });
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
            res.send({
                id: account._id,
                address: account.address,
            });
        }
    } catch (e) {
        next(new HttpError(502, 'Account find failed', e));
    }
};

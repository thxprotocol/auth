import { Response, NextFunction } from 'express';
import { AccountDocument, IAccountUpdates } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const patchAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getAccount() {
        const { account, error } = await AccountService.get(req.params.id);

        if (error) throw new Error(error.message);

        return account;
    }

    async function patchAccount(account: AccountDocument, updates: IAccountUpdates) {
        const { result, error } = await AccountService.update(account, updates);
        if (error) {
            if (error.code === 11000) {
                return next(new HttpError(422, 'A user for this e-mail already exists.', error));
            }
            return next(new HttpError(500, 'Could not update the account.', error));
        }
        if (!result) {
            return next(new HttpError(500, 'Could not find a result for the account update', error));
        }
    }

    try {
        const account = await getAccount();

        await patchAccount(account, {
            address: req.body.address,
            googleAccess: req.body.googleAccess,
            twitterAccess: req.body.twitterAccess,
        });

        res.status(204).end();
    } catch (err) {
        next(new HttpError(502, 'Account find failed.', err));
        return;
    }
};

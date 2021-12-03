import { Response, NextFunction } from 'express';
import { AccountDocument } from '../../models/Account';
import { HttpError, HttpRequest } from '../../models/Error';
import AccountService from '../../services/AccountService';

export const patchAccount = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getAccount() {
        const { account, error } = await AccountService.get(req.params.id);

        if (error) throw new Error(error.message);

        return account;
    }

    async function patchAccount(account: AccountDocument, { address }: { address: string }) {
        const { result, error } = await AccountService.update(account, {
            address,
        });
        if (error) {
            if (error.code === 11000) {
                return next(new HttpError(422, 'A user for this e-mail already exists.', error));
            }
        }
        if (!result) {
            return next(new HttpError(502, 'Account save failed', error));
        }
    }

    try {
        const account = await getAccount();

        await patchAccount(account, { address: req.body.address });

        res.status(204).end();
    } catch (err) {
        next(new HttpError(502, 'Account find failed.', err));
        return;
    }
};

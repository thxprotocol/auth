import { Request, Response } from 'express';
import { AccountService } from '../../services/AccountService';

export const getActiveAccountsEmail = async (req: Request, res: Response) => {
    const accounts = await AccountService.getActiveAccountsEmail();
    console.log('accounts', accounts);
    const result = accounts.map((account) => {
        return {
            id: String(account._id),
            firstName: account.firstName,
            email: account.email,
            createdAt: account.createdAt,
        };
    });

    res.send(result);
};

import { Request, Response } from 'express';
import AccountService from '../../services/AccountService';

export const deleteAccount = async (req: Request, res: Response) => {
    await AccountService.remove(req.user.sub);

    res.status(204).end();
};

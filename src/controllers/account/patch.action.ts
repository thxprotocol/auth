import { Request, Response } from 'express';
import AccountService from '../../services/AccountService';
import { NotFoundError, UnprocessableEntityError } from '../../util/errors';

export const patchAccount = async (req: Request, res: Response) => {
    const account = await AccountService.get(req.params.id);
    if (!account) {
        throw new NotFoundError();
    }
    try {
        await AccountService.update(account, {
            address: req.body.address,
            googleAccess: req.body.googleAccess,
            twitterAccess: req.body.twitterAccess,
            spotifyAccess: req.body.spotifyAccess,
            authenticationToken: req.body.authenticationToken,
            authenticationTokenExpires: req.body.authenticationTokenExpires,
        });
        res.status(204).end();
    } catch (error) {
        if (error.code === 11000) {
            throw new UnprocessableEntityError('A user for this e-mail already exists.');
        }
        throw error();
    }
};

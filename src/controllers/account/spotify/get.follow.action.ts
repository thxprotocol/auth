import { Request, Response } from 'express';
import { AccountDocument } from '../../../models/Account';
import SpotifyService from '../../../services/SpotifyService';
import AccountService from '../../../services/AccountService';

async function getAccount(sub: string): Promise<AccountDocument> {
    const { account, error } = await AccountService.get(sub);
    if (error) throw new Error(error.message);
    return account;
}

async function getSpotifyUser(accessToken: string) {
    const { user, error } = await SpotifyService.getUser(accessToken);
    if (error) throw new Error(error.message);
    return user;
}

export const getSpotifyUserFollow = async (req: Request, res: Response) => {
    const account = await getAccount(req.params.sub);
    const { result, error } = await SpotifyService.validateUserFollow(account.spotifyAccessToken, [req.params.item]);
    if (error) throw new Error(error.message);
    res.json({ result });
};

export const getSpotifyPlaylistFollow = async (req: Request, res: Response) => {
    const account = await getAccount(req.params.sub);
    const user = await getSpotifyUser(account.spotifyAccessToken);

    const { result, error } = await SpotifyService.validatePlaylistFollow(account.spotifyAccessToken, user.id, [
        req.params.item,
    ]);
    if (error) throw new Error(error.message);
    res.json({ result });
};

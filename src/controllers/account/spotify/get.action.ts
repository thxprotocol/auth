import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../../models/Error';
import { AccountDocument } from '../../../models/Account';
import SpotifyService from '../../../services/SpotifyService';
import AccountService from '../../../services/AccountService';

export const getSpotify = async (req: Request, res: Response, next: NextFunction) => {
    async function getAccount(): Promise<AccountDocument> {
        const { account, error } = await AccountService.get(req.params.sub);
        if (error) throw new Error(error.message);
        return account;
    }

    async function getSpotifyUser(accessToken: string) {
        const { user, error } = await SpotifyService.getUser(accessToken);
        if (error) throw new Error(error.message);
        return user;
    }

    async function refreshToken(refreshToken: string) {
        const { tokens, error } = await SpotifyService.refreshTokens(refreshToken);
        if (error) throw new Error(error.message);
        return tokens;
    }

    async function updateTokens(account: AccountDocument, newAccessToken: string) {
        account.spotifyAccessToken = newAccessToken || account.spotifyAccessToken;
        account.spotifyAccessTokenExpires = Date.now() + Number(3600) * 1000;

        return await account.save();
    }

    try {
        let account = await getAccount();

        if (!account.spotifyAccessToken || !account.spotifyRefreshToken) {
            return res.json({ isAuthorized: false });
        }

        if (Date.now() * 1000 >= account.spotifyAccessTokenExpires) {
            const tokens = await refreshToken(account.spotifyRefreshToken);
            account = await updateTokens(account, tokens);
        }

        // const tweets = await getSpotifyTweets(account.spotifyAccessToken);
        const user = await getSpotifyUser(account.spotifyAccessToken);
        const playlists = await SpotifyService.getPlaylists(account.spotifyAccessToken);
        console.log(playlists);
        res.json({
            isAuthorized: true,
            playlists: playlists,
            users: [user],
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../../models/Error';
import { AccountDocument } from '../../../models/Account';
import SpotifyService from '../../../services/SpotifyService';
import AccountService from '../../../services/AccountService';

export const getSpotify = async (req: Request, res: Response, next: NextFunction) => {
    async function getAccount() {
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

    async function updateTokens(account: AccountDocument, tokens: any) {
        account.spotifyAccessToken = tokens.access_token || account.spotifyAccessToken;
        account.spotifyRefreshToken = tokens.refresh_token || account.spotifyRefreshToken;
        account.spotifyAccessTokenExpires = tokens.expires_in
            ? Date.now() + Number(tokens.expires_in) * 1000
            : account.spotifyAccessTokenExpires;

        return await account.save();
    }

    try {
        let account = await getAccount();

        if (!account.spotifyAccessToken || !account.spotifyRefreshToken) {
            return res.json({ isAuthorized: false });
        }

        if (Date.now() >= account.spotifyAccessTokenExpires) {
            const tokens = await refreshToken(account.spotifyRefreshToken);
            account = await updateTokens(account, tokens);
        }

        // const tweets = await getSpotifyTweets(account.spotifyAccessToken);
        const user = await getSpotifyUser(account.spotifyAccessToken);

        res.json({
            isAuthorized: true,
            users: [user],
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

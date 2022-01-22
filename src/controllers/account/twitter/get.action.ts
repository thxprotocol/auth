import { Response, NextFunction } from 'express';
import { HttpError, HttpRequest } from '../../../models/Error';
import { AccountDocument } from '../../../models/Account';
import TwitterService from '../../../services/TwitterService';
import AccountService from '../../../services/AccountService';

export const getTwitter = async (req: HttpRequest, res: Response, next: NextFunction) => {
    async function getAccount() {
        const { account, error } = await AccountService.get(req.params.sub);
        if (error) throw new Error(error.message);
        return account;
    }
    async function getTwitterUser(accessToken: string) {
        const { user, error } = await TwitterService.getUser(accessToken);
        if (error) throw new Error(error.message);
        return user;
    }
    async function getTwitterTweets(accessToken: string) {
        const { tweets, error } = await TwitterService.getTweets(accessToken);
        if (error) throw new Error(error.message);
        return tweets;
    }

    async function refreshToken(refreshToken: string) {
        const { tokens, error } = await TwitterService.refreshTokens(refreshToken);
        if (error) throw new Error(error.message);
        return tokens;
    }

    async function updateTokens(account: AccountDocument, tokens: any) {
        account.twitterAccessToken = tokens.access_token || account.twitterAccessToken;
        account.twitterRefreshToken = tokens.refresh_token || account.twitterRefreshToken;
        account.twitterAccessTokenExpires = tokens.expires_in
            ? Date.now() + Number(tokens.expires_in) * 1000
            : account.twitterAccessTokenExpires;

        return await account.save();
    }

    try {
        let account = await getAccount();

        if (!account.twitterAccessToken || !account.twitterRefreshToken) {
            return res.json({ isAuthorized: false });
        }

        if (Date.now() >= account.twitterAccessTokenExpires) {
            const tokens = await refreshToken(account.twitterRefreshToken);
            account = await updateTokens(account, tokens);
        }

        const tweets = await getTwitterTweets(account.twitterAccessToken);
        const user = await getTwitterUser(account.twitterAccessToken);

        res.json({
            isAuthorized: true,
            tweets,
            users: [user],
        });
    } catch (error) {
        next(new HttpError(502, error.message, error));
    }
};

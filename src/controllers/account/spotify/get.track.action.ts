import { Request, Response } from 'express';
import { AccountDocument } from '../../../models/Account';
import SpotifyService from '../../../services/SpotifyService';
import AccountService from '../../../services/AccountService';

async function getAccount(sub: string): Promise<AccountDocument> {
    const { account, error } = await AccountService.get(sub);
    if (error) throw new Error(error.message);
    return account;
}

export async function getSpotifyTrackPlaying(req: Request, res: Response) {
    const account = await getAccount(req.params.sub);
    const { result, error } = await SpotifyService.validateTrackPlaying(account.spotifyAccessToken, req.params.item);
    if (error) throw new Error(error.message);
    res.json({ result });
}

export async function getSpotifyTrackRecent(req: Request, res: Response) {
    const account = await getAccount(req.params.sub);
    const { result, error } = await SpotifyService.validateRecentTrack(account.spotifyAccessToken, req.params.item);
    if (error) throw new Error(error.message);
    res.json({ result });
}

export async function getSpotifyTrackSaved(req: Request, res: Response) {
    const account = await getAccount(req.params.sub);
    const { result, error } = await SpotifyService.validateSavedTracks(account.spotifyAccessToken, [req.params.item]);
    if (error) throw new Error(error.message);
    res.json({ result });
}

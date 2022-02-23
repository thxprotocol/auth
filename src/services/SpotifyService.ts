import axios from 'axios';
import { Playlist } from '../types';
import { PlaylistItem } from '../types/PlaylistItem';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '../util/secrets';

export const SPOTIFY_API_ENDPOINT = 'https://api.spotify.com/v1/';
export const SPOTIFY_API_SCOPE = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';
const ERROR_NO_DATA = 'Could not find an Spotify data for this accesstoken';
const ERROR_NOT_AUTHORIZED = 'Not authorized for Spotify API';
const ERROR_TOKEN_REQUEST_FAILED = 'Failed to request access token';

axios.defaults.baseURL = SPOTIFY_API_ENDPOINT;

export default class SpotifyDataService {
    static async _fetchPlaylist(accessToken: string, offset = 0) {
        try {
            const params = new URLSearchParams();
            params.set('offset', `${offset}`);

            const r = await axios({
                url: `https://api.spotify.com/v1/me/playlists?${params.toString()}`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return { ...r.data };
        } catch (error) {
            return { error };
        }
    }

    static async _fetchPlaylistItems(accessToken: string, playlistId: string, offset = 0) {
        try {
            const params = new URLSearchParams();
            params.set('fields', 'items(track(id, name, album(images)))');
            params.set('offset', `${offset}`);

            const r = await axios({
                url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${params.toString()}`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            return { ...r.data };
        } catch (error) {
            return { error };
        }
    }

    static getSpotifyUrl(state?: string) {
        const body = new URLSearchParams();

        if (state) body.append('state', state);
        body.append('response_type', 'code');
        body.append('client_id', SPOTIFY_CLIENT_ID);
        body.append('redirect_uri', SPOTIFY_REDIRECT_URI);
        body.append('scope', SPOTIFY_API_SCOPE);

        return `https://accounts.spotify.com/authorize?${body.toString()}`;
    }

    static async requestTokens(code: string) {
        const body = new URLSearchParams();
        body.append('code', code);
        body.append('grant_type', 'authorization_code');
        body.append('redirect_uri', SPOTIFY_REDIRECT_URI);

        const r = await axios({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization':
                    'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
            },
            data: body,
        });

        if (r.status !== 200) {
            throw new Error('Failed to request access token');
        }
        return r.data;
    }

    static async validateFollow(
        accessToken: string,
        toIds: string[],
    ): Promise<Partial<{ followed: { [toId: string]: boolean }; error: any }>> {
        try {
            const params = new URLSearchParams();
            params.set('ids', `${toIds.join(',')}`);

            const r = await axios({
                url: `https://api.spotify.com/v1/me/following/contains?${params.toString()}`,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
            if (!r.data) throw new Error(ERROR_NO_DATA);

            const followed = (r.data as boolean[]).reduce((pre, cur, index) => ({ ...pre, [toIds[index]]: cur }), {});

            return { followed };
        } catch (error) {
            return { error };
        }
    }

    static async getUser(accessToken: string) {
        const r = await axios({
            url: 'https://api.spotify.com/v1/me',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (r.status !== 200) throw new Error(ERROR_NOT_AUTHORIZED);
        if (!r.data) throw new Error(ERROR_NO_DATA);

        return r.data;
    }

    static async getPlaylists(accessToken: string) {
        let playlists: Playlist[] = [];
        let offset = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { error, ...data } = await this._fetchPlaylist(accessToken, offset);
            if (error) throw new Error(error.message);

            let newPlaylists = data.items as Playlist[];
            newPlaylists = newPlaylists.filter((playlist) => playlist.public);

            playlists = [...playlists, ...newPlaylists];
            if (!data.next) break;

            offset += 20; //20 is the max limit per request of spotify
        }

        return playlists;
    }

    static async getPlaylistItems(accessToken: string, playlistId: string) {
        let items: PlaylistItem[] = [];
        let offset = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { error, ...data } = await this._fetchPlaylistItems(accessToken, playlistId, offset);
            if (error) throw new Error(error.message);

            const newItems = data.items as PlaylistItem[];

            items = [...items, ...newItems];
            if (!data.next) break;

            offset += 100; //20 is the max limit per request of spotify
        }

        return items;
    }

    static async refreshTokens(refreshToken: string) {
        const body = new URLSearchParams();
        body.append('grant_type', 'refresh_token');
        body.append('refresh_token', refreshToken);

        const r = await axios({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization':
                    'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
            },
            data: body,
        });

        if (r.status !== 200) throw new Error(ERROR_TOKEN_REQUEST_FAILED);

        return r.data.access_token;
    }
}

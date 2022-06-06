import express from 'express';
import checkScopes from 'express-jwt-authz';
import { getAccount, getAccountByAddress, getAccountByEmail } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { postAccount } from './post.action';
import { validate } from '../../util/validate';
import { validations } from './_.validation';
import { validateJwt } from '../../middlewares';
import { getTwitter } from './twitter/get.action';
import { getTwitterLike } from './twitter/getLike.action';
import { getTwitterRetweet } from './twitter/getRetweet.action';
import { getTwitterFollow } from './twitter/getFollow.action';
import { getYoutube } from './google/get.controller';
import { getYoutubeLike } from './google/youtube/like/get.controller';
import { getYoutubeSubscribe } from './google/youtube/subscribe/get.controller';
import { getSpotifyUserFollow, getSpotifyPlaylistFollow } from './spotify/get.follow.action';
import { getSpotifyTrackPlaying, getSpotifyTrackRecent, getSpotifyTrackSaved } from './spotify/get.track.action';
import { getSpotify } from './spotify/get.action';
import { createLoginValidation, postLogin } from './login/post.controller';

const router = express.Router();

router.use(validateJwt);
router.post('/', checkScopes(['account:read', 'account:write']), validate(validations.postAccount), postAccount);
router.get('/:id', checkScopes(['account:read']), getAccount);

router.get('/:sub/twitter', checkScopes(['account:read']), getTwitter);
router.get('/:sub/twitter/like/:item', checkScopes(['account:read']), getTwitterLike);
router.get('/:sub/twitter/retweet/:item', checkScopes(['account:read']), getTwitterRetweet);
router.get('/:sub/twitter/follow/:item', checkScopes(['account:read']), getTwitterFollow);

router.get('/:sub/google/youtube', checkScopes(['account:read']), getYoutube);
router.get('/:sub/google/youtube/like/:item', checkScopes(['account:read']), getYoutubeLike);
router.get('/:sub/google/youtube/subscribe/:item', checkScopes(['account:read']), getYoutubeSubscribe);

router.get('/:sub/spotify', checkScopes(['account:read']), getSpotify);
router.get('/:sub/spotify/user_follow/:item', checkScopes(['account:read']), getSpotifyUserFollow);
router.get('/:sub/spotify/playlist_follow/:item', checkScopes(['account:read']), getSpotifyPlaylistFollow);
router.get('/:sub/spotify/track_playing/:item', checkScopes(['account:read']), getSpotifyTrackPlaying);
router.get('/:sub/spotify/track_recent/:item', checkScopes(['account:read']), getSpotifyTrackRecent);
router.get('/:sub/spotify/track_saved/:item', checkScopes(['account:read']), getSpotifyTrackSaved);

router.get('/address/:address', checkScopes(['account:read']), validate([]), getAccountByAddress);
router.get('/email/:email', checkScopes(['account:read']), validate([]), getAccountByEmail);
router.patch('/:id', checkScopes(['account:read', 'account:write'], { checkAllScopes: true }), patchAccount);
router.delete('/:id', checkScopes(['account:write']), deleteAccount);

router.post('/login', validate(createLoginValidation), checkScopes(['account:write']), postLogin);

export default router;

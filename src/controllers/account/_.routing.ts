import express from 'express';
import checkScopes from 'express-jwt-authz';
import { getAccount, getAccountByAddress, getAccountByEmail } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { postAccount } from './post.action';
import { validate } from '../../util/validate';
import { validations } from './_.validation';
import { validateJwt } from '../../middlewares/validateJwt';
import { getTwitter } from './twitter/get.action';
import { getTwitterLike } from './twitter/getLike.action';
import { getTwitterRetweet } from './twitter/getRetweet.action';
import { getTwitterFollow } from './twitter/getFollow.action';
import { getYoutube } from './youtube/get.action';
import { getYoutubeLike } from './youtube/getLike.action';
import { getYoutubeSubscribe } from './youtube/getSubscribe.action';
import { getSpotify } from './spotify/get.action';

const router = express.Router();

router.use(validateJwt);
router.post('/', checkScopes(['account:read', 'account:write']), validate(validations.postAccount), postAccount);
router.get('/:id', checkScopes(['account:read']), getAccount);

router.get('/:sub/twitter', checkScopes(['account:read']), getTwitter);
router.get('/:sub/twitter/like/:item', checkScopes(['account:read']), getTwitterLike);
router.get('/:sub/twitter/retweet/:item', checkScopes(['account:read']), getTwitterRetweet);
router.get('/:sub/twitter/follow/:item', checkScopes(['account:read']), getTwitterFollow);

router.get('/:sub/youtube', checkScopes(['account:read']), getYoutube);
router.get('/:sub/youtube/like/:item', checkScopes(['account:read']), getYoutubeLike);
router.get('/:sub/youtube/subscribe/:item', checkScopes(['account:read']), getYoutubeSubscribe);

router.get('/:sub/spotify', checkScopes(['account:read']), getSpotify);

router.get('/address/:address', checkScopes(['account:read']), validate([]), getAccountByAddress);
router.get('/email/:email', checkScopes(['account:read']), validate([]), getAccountByEmail);
router.patch('/:id', checkScopes(['account:read', 'account:write'], { checkAllScopes: true }), patchAccount);
router.delete('/:id', checkScopes(['account:write']), deleteAccount);

export default router;

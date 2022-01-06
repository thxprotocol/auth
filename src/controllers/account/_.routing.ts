import express from 'express';
import checkScopes from 'express-jwt-authz';
import { getAccount, getAccountByAddress, getAccountByEmail } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { postAccount } from './post.action';
import { validate } from '../../util/validate';
import { validations } from './_.validation';
import { checkJwt } from '../../util/jwt';
import { getTwitter } from './getTwitter.action';
import { getTwitterLike } from './getTwitterLike.action';
import { getYoutube } from './getYoutube.action';
import { getYoutubeLike } from './getYoutubeLike.action';
import { getYoutubeSubscribe } from './getYoutubeSubscribe.action';

const router = express.Router();

router.use(checkJwt);
router.post('/', checkScopes(['account:read', 'account:write']), validate(validations.postAccount), postAccount);
router.get('/:id', checkScopes(['account:read']), getAccount);

router.get('/:sub/twitter', checkScopes(['account:read']), getTwitter);
router.get('/:sub/twitter/like/:item', checkScopes(['account:read']), getTwitterLike);

router.get('/:sub/youtube', checkScopes(['account:read']), getYoutube);
router.get('/:sub/youtube/like/:item', checkScopes(['account:read']), getYoutubeLike);
router.get('/:sub/youtube/subscribe/:item', checkScopes(['account:read']), getYoutubeSubscribe);

router.get('/address/:address', checkScopes(['account:read']), validate([]), getAccountByAddress);
router.get('/email/:email', checkScopes(['account:read']), validate([]), getAccountByEmail);
router.patch('/:id', checkScopes(['account:read', 'account:write'], { checkAllScopes: true }), patchAccount);
router.delete('/:id', checkScopes(['account:write']), deleteAccount);

export default router;

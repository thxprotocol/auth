import express from 'express';
import { getAccount, getAccountByAddress, getAccountByEmail } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import { postAccount } from './post.action';
import { validate } from '../../util/validate';
import { validations } from './_.validation';
import { guard, validateJwt } from '../../middlewares';
import { getTwitter } from './twitter/get.action';
import { getTwitterLike } from './twitter/getLike.action';
import { getTwitterRetweet } from './twitter/getRetweet.action';
import { getTwitterFollow } from './twitter/getFollow.action';
import { getYoutube } from './google/get.controller';
import { getYoutubeLike } from './google/youtube/like/get.controller';
import { getYoutubeSubscribe } from './google/youtube/subscribe/get.controller';
import { createLoginValidation, postLogin } from './login/post.controller';

const router = express.Router();

router.use(validateJwt);
router.post('/', guard.check(['account:read', 'account:write']), validate(validations.postAccount), postAccount);
router.get('/:id', guard.check(['account:read']), getAccount);

router.get('/:sub/twitter', guard.check(['account:read']), getTwitter);
router.get('/:sub/twitter/like/:item', guard.check(['account:read']), getTwitterLike);
router.get('/:sub/twitter/retweet/:item', guard.check(['account:read']), getTwitterRetweet);
router.get('/:sub/twitter/follow/:item', guard.check(['account:read']), getTwitterFollow);

router.get('/:sub/google/youtube', guard.check(['account:read']), getYoutube);
router.get('/:sub/google/youtube/like/:item', guard.check(['account:read']), getYoutubeLike);
router.get('/:sub/google/youtube/subscribe/:item', guard.check(['account:read']), getYoutubeSubscribe);

router.get('/address/:address', guard.check(['account:read']), validate([]), getAccountByAddress);
router.get('/email/:email', guard.check(['account:read']), validate([]), getAccountByEmail);
router.patch('/:id', guard.check(['account:read', 'account:write']), patchAccount);
router.delete('/:id', guard.check(['account:write']), deleteAccount);

router.post('/login', validate(createLoginValidation), guard.check(['account:write']), postLogin);

export default router;

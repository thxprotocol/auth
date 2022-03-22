import express, { urlencoded } from 'express';
import getController from './get.action';
import ReadAbort from './abort/get';
import ReadForgot from './forgot/get';
import ReadSignin from './signin/get';
import CreateSignin from './signin/post';
import CreateSignup from './signup/post';
import ReadSignup from './signup/get';
import ReadClaim from './claim/get';
import ReadReset from './reset/get';
import ReadConfirm from './confirm/get';
import postPasswordController from './password/postPassword.action';
import CreateForgot from './forgot/post';
import CreateReset from './reset/post';
import { ReadCallbackGoogle } from './callback/google/get.controller';
import { ReadCallbackTwitter } from './callback/twitter/get.controller';
import { ReadCallbackSpotify } from './callback/spotify/get.controller';
import ReadAccount from './account/get';
import UpdateAccount from './account/post';
import UpdateAccountTOTP from './account/totp/post';

const router = express.Router();

router.get('/callback/google', ReadCallbackGoogle);
router.get('/callback/twitter', ReadCallbackTwitter);
router.get('/callback/spotify', ReadCallbackSpotify);

router.get('/:uid', getController);
router.get('/:uid/signin', ReadSignin.controller);
router.get('/:uid/signup', ReadSignup.controller);
router.get('/:uid/confirm', ReadConfirm.controller);
router.get('/:uid/reset', ReadReset.controller);
router.get('/:uid/claim', ReadClaim.controller);

router.post('/:uid/signin', urlencoded({ extended: false }), CreateSignin.controller);
router.post('/:uid/signup', urlencoded({ extended: false }), CreateSignup);
router.post('/:uid/password', urlencoded({ extended: false }), postPasswordController);

router.get('/:uid/abort', ReadAbort.controller);
router.get('/:uid/forgot', ReadForgot.controller);
router.post('/:uid/forgot', urlencoded({ extended: false }), CreateForgot.controller);
router.post('/:uid/reset', urlencoded({ extended: false }), CreateReset.controller);

router.get('/:uid/account', ReadAccount.controller);
router.post('/:uid/account', urlencoded({ extended: false }), UpdateAccount.validation, UpdateAccount.controller);
router.post('/:uid/account/totp', urlencoded({ extended: false }), UpdateAccountTOTP.controller);

export default router;

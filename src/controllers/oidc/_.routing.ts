import express, { urlencoded } from 'express';
import getController from './get.action';
import getAbortController from './getAbort.action';
import getForgotController from './getForgot.action';
import postCreateController from './postCreate.action';
import postForgotController from './postForgot.action';
import postLoginController from './postLogin.action';
import postPasswordController from './postPassword.action';
import postResetController from './postReset.action';
import getGoogleCallback from './getCallbackGoogle.action';
import getTwitterCallback from './getCallbackTwitter.action';
import getSpotifyCallback from './getCallbackSpotify.action';

const router = express.Router();

router.get('/callback/google', getGoogleCallback);
router.get('/callback/twitter', getTwitterCallback);
router.get('/callback/spotify', getSpotifyCallback);
router.get('/:uid', getController);
router.post('/:uid/create', urlencoded({ extended: false }), postCreateController);
router.post('/:uid/password', urlencoded({ extended: false }), postPasswordController);
router.post('/:uid/login', urlencoded({ extended: false }), postLoginController);
router.get('/:uid/abort', getAbortController);
router.get('/:uid/forgot', getForgotController);
router.post('/:uid/forgot', urlencoded({ extended: false }), postForgotController);
router.post('/:uid/reset', urlencoded({ extended: false }), postResetController);

export default router;

import express, { urlencoded } from 'express';
import getController from './get.action';
import getAbortController from './getAbort.action';
import getForgotController from './getForgot.action';
import postCreateController from './postCreate.action';
import postForgotController from './postForgot.action';
import postLoginController from './postLogin.action';
import postPasswordController from './postPassword.action';
import postResetController from './postReset.action';

const router = express.Router();

router.get('/oidc/:uid', getController);
router.post('/oidc/:uid/create', urlencoded({ extended: false }), postCreateController);
router.post('/oidc/:uid/password', urlencoded({ extended: false }), postPasswordController);
router.post('/oidc/:uid/login', urlencoded({ extended: false }), postLoginController);
router.get('/oidc/:uid/abort', getAbortController);
router.get('/oidc/:uid/forgot', getForgotController);
router.post('/oidc/:uid/forgot', urlencoded({ extended: false }), postForgotController);
router.post('/oidc/:uid/reset', urlencoded({ extended: false }), postResetController);

export default router;

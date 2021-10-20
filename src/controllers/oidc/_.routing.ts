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

router.get('/interaction/:uid', getController);
router.post('/interaction/:uid/create', urlencoded({ extended: false }), postCreateController);
router.post('/interaction/:uid/password', urlencoded({ extended: false }), postPasswordController);
router.post('/interaction/:uid/login', urlencoded({ extended: false }), postLoginController);
router.get('/interaction/:uid/abort', getAbortController);
router.get('/interaction/:uid/forgot', getForgotController);
router.post('/interaction/:uid/forgot', urlencoded({ extended: false }), postForgotController);
router.post('/interaction/:uid/reset', urlencoded({ extended: false }), postResetController);

export default router;

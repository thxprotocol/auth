import express from 'express';
import { getAccount } from './get.action';
import { patchAccount } from './patch.action';
import { deleteAccount } from './delete.action';
import checkScopes from 'express-jwt-authz';

const router = express.Router();

router.get('/', checkScopes(['user', 'widget', 'dashboard']), getAccount);
router.patch('/', checkScopes(['user', 'dashboard']), patchAccount);
router.delete('/', checkScopes(['user', 'dashboard']), deleteAccount);

export default router;

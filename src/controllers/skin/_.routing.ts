import express from 'express';
import { validate } from '../../util/validate';

import GetSkin from './get.controller';
import PutSkin from './put.controller';

const router = express.Router();
router.get('/:pool_address', GetSkin.controller);
router.put('/:pool_address', validate(PutSkin.validation), PutSkin.controller);

export default router;

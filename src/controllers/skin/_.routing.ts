import express from 'express';
import { upload } from '../../util/multer';

import GetSkin from './get.controller';
import PutSkin from './put.controller';

const router = express.Router();
router.get('/:pool_address', GetSkin.controller);
router.put(
    '/:pool_address',
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'background', maxCount: 1 },
    ]),
    PutSkin.controller,
);

export default router;

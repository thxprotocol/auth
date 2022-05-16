import { Request, Response } from 'express';
import { body } from 'express-validator';

import SkinService from '../../services/SkinService';

const validation = [body('logoImgUrl').exists().isString(), body('logoImgUrl').exists().isString()];

const patchSkinByPool = async (req: Request, res: Response) => {
    const poolAddress = req.params['pool_address'];
    const updatedSkin = await SkinService.update({ poolAddress }, req.body);
    res.send(updatedSkin.toJSON());
};

export default {
    controller: patchSkinByPool,
    validation: validation,
};

import { Request, Response } from 'express';
import { body } from 'express-validator';

import SkinService from '../../services/SkinService';
import ImageService from '../../services/ImageService';

const validation = [body('background').notEmpty(), body('logo').notEmpty()];

const patchSkinByPool = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const background = files['background']?.[0];
    const logo = files['logo']?.[0];

    const backgroundImgKey = background && (await ImageService.upload(background)).key;
    const logoImgKey = logo && (await ImageService.upload(logo)).key;

    const poolAddress = req.params['pool_address'];
    const skin = await SkinService.update({ poolAddress }, { backgroundImgKey, logoImgKey });

    res.send({
        backgroundImgUrl: skin.backgroundImgKey && (await ImageService.getSignedUrl(skin.backgroundImgKey)),
        logoImgUrl: skin.logoImgKey && (await ImageService.getSignedUrl(skin.logoImgKey)),
    });
};

export default {
    controller: patchSkinByPool,
    validation: validation,
};

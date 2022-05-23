import { Request, Response } from 'express';
import ImageService from '../../services/ImageService';
import SkinService from '../../services/SkinService';

const getSkinByPool = async (req: Request, res: Response) => {
    const poolAddress = req.params['pool_address'];
    const skin = await SkinService.get(poolAddress);
    const data = skin?.toJSON();
    if (!data) res.status(422).send();

    const response = {
        backgroundImgUrl: data.backgroundImgKey && (await ImageService.getSignedUrl(data.backgroundImgKey)),
        logoImgUrl: data.logoImgKey && (await ImageService.getSignedUrl(data.logoImgKey)),
    };

    res.send(response);
};

export default {
    controller: getSkinByPool,
};

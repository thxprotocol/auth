import { Request, Response } from 'express';
import SkinService from '../../services/SkinService';

const getSkinByPool = async (req: Request, res: Response) => {
    const poolAddress = req.params['pool_address'];
    const skin = await SkinService.get(poolAddress);
    const data = skin?.toJSON();
    if (!data) res.status(422).send();
    res.send(data);
};

export default {
    controller: getSkinByPool,
};

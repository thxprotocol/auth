import { Request, Response } from '../../../types/request';

async function controller(req: Request, res: Response) {
    const { uid, params } = req.interaction;

    res.render('signup', { uid, params });
}

export default { controller };

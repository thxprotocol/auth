import { Request, Response } from 'express';
import { oidc } from '../../../util/oidc';

async function controller(req: Request, res: Response) {
    const { uid, params } = await oidc.interactionDetails(req, res);

    res.render('forgot', {
        uid,
        params,
        alert: {},
    });
}

export default { controller };

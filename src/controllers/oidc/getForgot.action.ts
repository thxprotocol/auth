import { Request, Response } from 'express';
import { oidc } from '.';
import { GTM } from '../../util/secrets';

export default async function getForgotController(req: Request, res: Response) {
    const { uid, params } = await oidc.interactionDetails(req, res);

    res.render('forgot', {
        uid,
        params,
        alert: {},
        gtm: GTM,
    });
}

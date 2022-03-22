import { Request, Response } from 'express';
import { oidc } from '../../../util/oidc';

async function controller(req: Request, res: Response) {
    const interaction = await oidc.interactionDetails(req, res);
    if (!interaction) throw new Error('Could not find the interaction.');
    const { uid, params } = interaction;

    res.render('signup', { uid, params });
}

export default { controller };

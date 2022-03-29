import { Request, Response, NextFunction } from '../types/request';
import { oidc } from '../util/oidc';

export async function assertInteraction(req: Request, res: Response, next: NextFunction) {
    const interaction = await oidc.interactionDetails(req, res);
    if (!interaction) throw new Error('Could not find the interaction.');
    req.interaction = interaction;
    next();
}

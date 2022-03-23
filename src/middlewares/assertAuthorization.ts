import { Request, Response, NextFunction } from '../types/request';

export async function assertAuthorization(req: Request, res: Response, next: NextFunction) {
    if (req.interaction && !req.interaction.session) throw new Error('Not authorized');
    next();
}

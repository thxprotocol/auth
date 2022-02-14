export {};

declare global {
    namespace Express {
        export interface Request {
            origin?: string;
            user?: any;
        }
    }
}

export {};

declare global {
    namespace Express {
        interface Request {
            origin?: string;
            user?: any;
        }
    }
}

import express from 'express';
import { InteractionResults } from 'oidc-provider';

export type Request = express.Request & { interaction: InteractionResults };
export type Response = express.Response;
export type NextFunction = express.NextFunction;

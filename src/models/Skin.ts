import mongoose from 'mongoose';

export type ISkinUpdate = Partial<ISkin>;

export interface ISkin {
    logoImgKey: string;
    backgroundImgKey: string;
    poolAddress: string;
    clientId: string;
}

const skinSchema = new mongoose.Schema({
    logoImgKey: String,
    backgroundImgKey: String,
    poolAddress: String,
    clientId: String,
});

export default mongoose.model<ISkin>('skin', skinSchema);

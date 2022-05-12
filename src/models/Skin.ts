import mongoose from 'mongoose';

export type ISkinUpdate = Partial<ISkin>;

export interface ISkin {
    logoImgUrl: string;
    backgroundImgUrl: string;
    poolAddress: string;
    clientId: string;
}

const skinSchema = new mongoose.Schema({
    logoImgUrl: String,
    backgroundImgUrl: String,
    poolAddress: String,
    clientId: String,
});

export default mongoose.model<ISkin>('skin', skinSchema);

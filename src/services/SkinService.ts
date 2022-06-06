import SkinModel, { ISkin, ISkinUpdate } from '../models/Skin';

type FindOptions = Partial<Pick<ISkin, 'clientId' | 'poolAddress'>>;

export default {
    get: async (poolAddress: string) => {
        return await SkinModel.findOne({ poolAddress });
    },

    update: async (options: FindOptions, updates: ISkinUpdate) => {
        return await SkinModel.findOneAndUpdate(options, updates, { upsert: true, new: true });
    },
};

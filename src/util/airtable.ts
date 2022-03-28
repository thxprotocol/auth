import Airtable from 'airtable';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } from './secrets';

interface PipelineSignUpParams {
    Email: string;
    Date: string | Date;
    AcceptUpdates?: boolean;
    [key: string]: any;
}

const formatDate = (datestring: string | Date) => {
    const date = new Date(datestring);
    return date.getMonth() + '/' + (date.getDay() + 1) + '/' + date.getFullYear();
};

export default {
    pipelineSignup: async (params: PipelineSignUpParams) => {
        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return;

        const base = new Airtable().base(AIRTABLE_BASE_ID);
        await base('Pipeline: Signups').create({
            ...(params as any),
            Date: formatDate(params.Date),
        });
    },
};

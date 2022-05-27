import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { s3Client } from '../util/s3';
import { AWS_BUCKET_NAME } from '../util/secrets';

export default {
    upload: async (file: Express.Multer.File) => {
        const filename = file.originalname.toLowerCase().split(' ').join('-') + '-';
        const stream = file.buffer;
        const uploadParams = {
            Key: filename,
            Bucket: AWS_BUCKET_NAME,
            Body: stream,
        };

        return { ...(await s3Client.send(new PutObjectCommand(uploadParams))), key: filename };
    },
    getSignedUrl: async (key: string) => {
        const command = new GetObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: key });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // expires in seconds
        return url;
    },
};

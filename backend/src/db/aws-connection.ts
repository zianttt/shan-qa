import { S3Client } from "@aws-sdk/client-s3";

export const createS3Client = () => {
    return new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})};

export const getS3BucketName = () => {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error("BUCKET_NAME environment variable is not set");
    }
    return process.env.S3_BUCKET_NAME;
}
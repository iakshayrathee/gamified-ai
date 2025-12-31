import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

export interface UploadAssetParams {
    file: Buffer;
    fileName: string;
    folder: 'images' | 'audio' | 'animations';
    subFolder?: string; // e.g., 'letters', 'words', 'uppercase'
    contentType: string;
}

export interface AssetMetadata {
    key: string;
    url: string;
    fileName: string;
    size: number;
    uploadedAt: Date;
}

/**
 * Upload an asset to S3
 * @param params Upload parameters
 * @returns Asset metadata including URL
 */
export async function uploadAsset(params: UploadAssetParams): Promise<AssetMetadata> {
    const { file, fileName, folder, subFolder, contentType } = params;

    // Construct S3 key with proper folder structure
    const key = subFolder
        ? `${folder}/${subFolder}/${fileName}`
        : `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    try {
        await s3Client.send(command);

        // Generate public URL (or signed URL if bucket is private)
        const url = await getAssetUrl(key);

        return {
            key,
            url,
            fileName,
            size: file.length,
            uploadedAt: new Date(),
        };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error(`Failed to upload asset: ${fileName}`);
    }
}

/**
 * Get a signed URL for an asset (valid for 1 hour)
 * @param key S3 object key
 * @returns Signed URL
 */
export async function getAssetUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        // Generate signed URL valid for 1 hour
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error(`Failed to get URL for asset: ${key}`);
    }
}

/**
 * Delete an asset from S3
 * @param key S3 object key
 */
export async function deleteAsset(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error(`Failed to delete asset: ${key}`);
    }
}

/**
 * List all assets in a folder
 * @param folder Folder name (images, audio, animations)
 * @param subFolder Optional subfolder
 * @returns List of asset keys
 */
export async function listAssets(folder: string, subFolder?: string): Promise<string[]> {
    const prefix = subFolder ? `${folder}/${subFolder}/` : `${folder}/`;

    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });

    try {
        const response = await s3Client.send(command);
        return response.Contents?.map(item => item.Key || '') || [];
    } catch (error) {
        console.error('Error listing S3 objects:', error);
        throw new Error(`Failed to list assets in: ${prefix}`);
    }
}

/**
 * Generate asset file name following naming convention
 * @param type Asset type (letter, word, instruction)
 * @param name Asset name (e.g., 'A', 'cat', 'tap_the_letter')
 * @param extension File extension (png, mp3, gif)
 * @returns Formatted file name
 */
export function generateAssetFileName(type: string, name: string, extension: string): string {
    // Convert to lowercase and replace spaces with underscores
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '_');

    // Format: type_name.extension (e.g., letter_A.png, word_cat.mp3)
    return `${type}_${sanitizedName}.${extension}`;
}

/**
 * Validate asset file type
 * @param contentType MIME type
 * @param folder Expected folder type
 * @returns True if valid
 */
export function validateAssetType(contentType: string, folder: 'images' | 'audio' | 'animations'): boolean {
    const validTypes: Record<string, string[]> = {
        images: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
        audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
        animations: ['image/gif', 'video/mp4', 'video/webm'],
    };

    return validTypes[folder]?.includes(contentType) || false;
}

export { s3Client, BUCKET_NAME };

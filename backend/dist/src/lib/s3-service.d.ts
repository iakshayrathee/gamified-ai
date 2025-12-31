import { S3Client } from '@aws-sdk/client-s3';
declare const s3Client: S3Client;
declare const BUCKET_NAME: string;
export interface UploadAssetParams {
    file: Buffer;
    fileName: string;
    folder: 'images' | 'audio' | 'animations';
    subFolder?: string;
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
export declare function uploadAsset(params: UploadAssetParams): Promise<AssetMetadata>;
/**
 * Get a signed URL for an asset (valid for 1 hour)
 * @param key S3 object key
 * @returns Signed URL
 */
export declare function getAssetUrl(key: string): Promise<string>;
/**
 * Delete an asset from S3
 * @param key S3 object key
 */
export declare function deleteAsset(key: string): Promise<void>;
/**
 * List all assets in a folder
 * @param folder Folder name (images, audio, animations)
 * @param subFolder Optional subfolder
 * @returns List of asset keys
 */
export declare function listAssets(folder: string, subFolder?: string): Promise<string[]>;
/**
 * Generate asset file name following naming convention
 * @param type Asset type (letter, word, instruction)
 * @param name Asset name (e.g., 'A', 'cat', 'tap_the_letter')
 * @param extension File extension (png, mp3, gif)
 * @returns Formatted file name
 */
export declare function generateAssetFileName(type: string, name: string, extension: string): string;
/**
 * Validate asset file type
 * @param contentType MIME type
 * @param folder Expected folder type
 * @returns True if valid
 */
export declare function validateAssetType(contentType: string, folder: 'images' | 'audio' | 'animations'): boolean;
export { s3Client, BUCKET_NAME };
//# sourceMappingURL=s3-service.d.ts.map
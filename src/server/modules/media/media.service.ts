import { mediaRepository, MediaRepository, type MediaAsset } from "./media.repository";
import { googleDriveService } from "./drive.service";
import { AppError } from "@/server/common/response";

const ALLOWED_MIME_TYPES = 
[
    'images/png',
    'images/jpg',
    'images/jpeg',
    'images/gif',
    'images/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;


export class MediaService
{
    async processAndUploadImage(file: File, uploaderId: string, altText?: string, caption?: string) : Promise<MediaAsset>
    {
        if(!ALLOWED_MIME_TYPES.includes(file.type))
            throw AppError.badRequest(`Unsupported format: ${file.type}. Allowed: PNG, JPEG, WEBP, GIF, SVG.`);

        if(file.size > MAX_FILE_SIZE)
            throw AppError.badRequest('File exceeds maximum size of 10MB.');

        const timestamp = Date.now();
        const santinized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${santinized}`;

        const driveResult = await googleDriveService.uploadFile(file, filename)

        const asset = await mediaRepository.create({
        uploaderId,
        driveFileId: driveResult.fileId,
        filename,
        mimeType: file.type,
        fileSizeBytes: file.size,
        webContentLink: driveResult.directUrl,
        webViewLink: driveResult.webViewLink,
        thumbnailLink: driveResult.directUrl,
        altText: altText || file.name,
        caption,
        });

        return asset;
    }

    async getRecentAssets(): Promise<MediaAsset[]>
    {
        return mediaRepository.listRecent(50);
    }
}

export const mediaService = new MediaService(); 
import type { ApiResponse, ApiErrorResponse } from "@/server/common/response";

export interface UploadOptions
{
    altText?: string;
    caption?: string;
    onSuccess?: (assets: UploadedAsset) => void;
    onError?: (error: Error) => void;
}

export interface UploadedAsset
{
    id: string;
    driveFileId: string;
    fileName: string;
    mimeType: string;
    webContentLink: string;
    webViewLink?: string;
    altText?: string;
    caption?: string;
}

export interface UseUploadReturn
{
    isUploading: boolean;
    error: string | null;
    uploadedAsset: UploadedAsset | null;
    upload: (file: File, options?: UploadOptions) => Promise<UploadedAsset | null>;
    reset: () => void;
}

export function useUpload(): UseUploadReturn
{
    let isUploading = false;
    let error: string | null = null;
    let uploadedAsset: UploadedAsset | null = null;

    const reset = () => 
        {
            isUploading = false;
            error = null;
            uploadedAsset = null;
        }

 const upload = async (
    file: File,
    options?: UploadOptions
  ): Promise<UploadedAsset | null> => {
    isUploading = true;
    error = null;

    const formData = new FormData();
    formData.append('file', file);
    if (options?.altText) formData.append('altText', options.altText);
    if (options?.caption) formData.append('caption', options.caption);

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const json: ApiResponse<UploadedAsset> | ApiErrorResponse = await response.json();

      if (!json.success) {
        const errMsg = json.error?.message || 'Upload failed.';
        error = errMsg;
        options?.onError?.(new Error(errMsg));
        throw new Error(errMsg);
      }

      uploadedAsset = json.data;
      options?.onSuccess?.(json.data);
      return json.data;
    } catch (err: any) {
      error = err.message || 'An unexpected error occurred.';
      options?.onError?.(err);
      return null;
    } finally {
      isUploading = false;
    }
  };

  return{
    get isUploading()
    {
        return isUploading;
    },

    get error()
    {
        return error;
    },

    get uploadedAsset()
    {
        return uploadedAsset;
    },
    upload,
    reset
  }
}
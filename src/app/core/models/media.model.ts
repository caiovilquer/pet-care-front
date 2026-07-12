export type MediaPurpose = 'PET_PHOTO' | 'TUTOR_AVATAR';

export interface MediaUploadInitiated {
  uploadId: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface MediaAssetResult {
  id: string;
  contentUrl: string;
}

export interface PreparedImage {
  file: File;
  previewUrl: string;
  checksumSha256: string;
}

export type MediaPurpose = 'PET_PHOTO' | 'TUTOR_AVATAR' | 'HEALTH_ATTACHMENT';

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

export interface PreparedAttachment {
  file: File;
  checksumSha256: string;
}

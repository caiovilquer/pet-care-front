import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  MediaAssetResult,
  MediaPurpose,
  MediaUploadInitiated,
  PreparedAttachment,
  PreparedImage
} from '../models/media.model';
import { CacheService } from './cache.service';
import { CacheKeys } from './cache-keys';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly apiUrl = `${environment.apiUrl}/media`;
  private readonly maxOutputBytes = 5 * 1024 * 1024;

  constructor(private http: HttpClient, private cache: CacheService) {}

  contentUrl(assetId?: string | null, legacyUrl?: string | null): string | null {
    return assetId ? `${this.apiUrl}/${encodeURIComponent(assetId)}/content` : legacyUrl || null;
  }

  async prepareImage(source: File): Promise<PreparedImage> {
    if (!['image/jpeg', 'image/png'].includes(source.type)) {
      throw new Error('Escolha uma imagem JPG ou PNG.');
    }
    if (source.size > 20 * 1024 * 1024) {
      throw new Error('A imagem original deve ter no máximo 20 MB.');
    }

    const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
    try {
      if (bitmap.width * bitmap.height > 40_000_000) {
        throw new Error('A imagem tem resolução muito alta. Escolha uma foto de até 40 megapixels.');
      }
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Não foi possível processar a imagem neste navegador.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      let blob: Blob | null = null;
      for (const quality of [0.86, 0.76, 0.66, 0.56]) {
        blob = await this.canvasBlob(canvas, quality);
        if (blob.size <= this.maxOutputBytes) break;
      }
      if (!blob || blob.size > this.maxOutputBytes) {
        throw new Error('Não foi possível reduzir a foto para 5 MB. Escolha outra imagem.');
      }

      const file = new File([blob], this.jpegName(source.name), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      const checksumSha256 = await this.sha256(file);
      return { file, checksumSha256, previewUrl: URL.createObjectURL(file) };
    } finally {
      bitmap.close();
    }
  }

  upload(
    purpose: MediaPurpose,
    targetId: number,
    prepared: PreparedImage,
    onProgress: (progress: number) => void
  ): Observable<MediaAssetResult> {
    return this.uploadFile(purpose, prepared.file, prepared.checksumSha256, onProgress, targetId);
  }

  async prepareAttachment(source: File): Promise<PreparedAttachment> {
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(source.type)) {
      throw new Error('Escolha um arquivo JPG, PNG ou PDF.');
    }
    if (source.size < 1 || source.size > 10 * 1024 * 1024) {
      throw new Error('Cada anexo deve ter no máximo 10 MB.');
    }
    const signature = new Uint8Array(await source.slice(0, 8).arrayBuffer());
    const valid = source.type === 'image/jpeg'
      ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      : source.type === 'image/png'
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => signature[index] === byte)
        : new TextDecoder('ascii').decode(signature).startsWith('%PDF-1.');
    if (!valid) throw new Error('O conteúdo do arquivo não corresponde ao formato informado.');
    return { file: source, checksumSha256: await this.sha256(source) };
  }

  uploadAttachment(
    recordId: string,
    prepared: PreparedAttachment,
    onProgress: (progress: number) => void
  ): Observable<MediaAssetResult> {
    return this.uploadFile('HEALTH_ATTACHMENT', prepared.file, prepared.checksumSha256, onProgress, undefined, recordId);
  }

  private uploadFile(
    purpose: MediaPurpose,
    file: File,
    checksumSha256: string,
    onProgress: (progress: number) => void,
    targetId?: number,
    targetUuid?: string
  ): Observable<MediaAssetResult> {
    const body = {
      purpose, targetId, targetUuid, filename: file.name, contentType: file.type,
      sizeBytes: file.size, checksumSha256
    };

    return this.http.post<MediaUploadInitiated>(`${this.apiUrl}/uploads`, body).pipe(
      switchMap(init => {
        const headers = new HttpHeaders(init.headers);
        const request = new HttpRequest('PUT', init.uploadUrl, file, {
          headers,
          reportProgress: true,
          responseType: 'text',
          withCredentials: false
        });
        return this.http.request(request).pipe(
          tap(event => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              onProgress(Math.round((event.loaded / event.total) * 100));
            }
          }),
          filter(event => event.type === HttpEventType.Response),
          switchMap(() => this.http.post<MediaAssetResult>(`${this.apiUrl}/${init.uploadId}/complete`, {}))
        );
      }),
      tap(() => this.invalidateMediaConsumers())
    );
  }

  delete(assetId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(assetId)}`).pipe(
      tap(() => this.invalidateMediaConsumers())
    );
  }

  private canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Falha ao preparar a imagem.')),
      'image/jpeg',
      quality
    ));
  }

  private async sha256(file: File): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private jpegName(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120) || 'foto';
    return `${base}.jpg`;
  }

  private invalidateMediaConsumers(): void {
    this.cache.invalidatePrefix(CacheKeys.petsPrefix);
    this.cache.invalidate(CacheKeys.tutorMe);
    this.cache.invalidate(CacheKeys.dashboard);
  }
}

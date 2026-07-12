import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { MediaAssetResult, MediaPurpose, PreparedImage } from '../../../core/models/media.model';
import { MediaService } from '../../../core/services/media.service';

@Component({
  selector: 'rp-photo-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './photo-upload.component.html',
  styleUrl: './photo-upload.component.css'
})
export class PhotoUploadComponent implements OnDestroy {
  @Input({ required: true }) purpose!: MediaPurpose;
  @Input() existingUrl: string | null = null;
  @Input() existingAssetId: string | null = null;
  @Input() label = 'Foto';
  @Input() subjectName = '';
  @Input() compact = false;

  prepared: PreparedImage | null = null;
  isPreparing = false;
  isUploading = false;
  isDragging = false;
  progress = 0;
  errorMessage = '';
  removalRequested = false;

  constructor(private media: MediaService) {}

  get previewUrl(): string | null {
    if (this.prepared) return this.prepared.previewUrl;
    return this.removalRequested ? null : this.existingUrl;
  }

  get hasChanges(): boolean {
    return !!this.prepared || this.removalRequested;
  }

  get fallbackInitial(): string | null {
    return this.purpose === 'TUTOR_AVATAR' && this.subjectName
      ? this.subjectName.charAt(0).toUpperCase()
      : null;
  }

  async onFile(file?: File): Promise<void> {
    if (!file || this.isPreparing || this.isUploading) return;
    this.errorMessage = '';
    this.isPreparing = true;
    try {
      const next = await this.media.prepareImage(file);
      this.releasePreview();
      this.prepared = next;
      this.removalRequested = false;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Não foi possível preparar a foto.';
    } finally {
      this.isPreparing = false;
    }
  }

  fileChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.onFile(input.files?.[0]);
    input.value = '';
  }

  dragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isUploading) this.isDragging = true;
  }

  dragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  dropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    void this.onFile(event.dataTransfer?.files?.[0]);
  }

  remove(): void {
    this.releasePreview();
    this.prepared = null;
    this.removalRequested = !!this.existingUrl || !!this.existingAssetId;
    this.errorMessage = '';
  }

  commit(targetId: number): Observable<MediaAssetResult | null> {
    if (this.isPreparing) return throwError(() => new Error('Aguarde a preparação da foto.'));
    if (this.prepared) {
      this.isUploading = true;
      this.progress = 0;
      return this.media.upload(this.purpose, targetId, this.prepared, value => this.progress = value);
    }
    if (this.removalRequested && this.existingAssetId) {
      this.isUploading = true;
      return this.media.delete(this.existingAssetId).pipe(map(() => null));
    }
    return of(null);
  }

  markComplete(): void {
    this.isUploading = false;
    this.progress = 100;
    this.releasePreview();
    this.prepared = null;
    this.removalRequested = false;
    this.errorMessage = '';
  }

  markFailed(message: string): void {
    this.isUploading = false;
    this.errorMessage = message;
  }

  ngOnDestroy(): void {
    this.releasePreview();
  }

  private releasePreview(): void {
    if (this.prepared?.previewUrl) URL.revokeObjectURL(this.prepared.previewUrl);
  }
}

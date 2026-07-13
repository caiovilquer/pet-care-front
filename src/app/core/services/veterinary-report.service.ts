import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PublicVeterinarySummary, VeterinaryShare, VeterinaryShareCreated, VeterinaryShareRequest, VeterinarySummary
} from '../models/veterinary-report.model';

@Injectable({ providedIn: 'root' })
export class VeterinaryReportService {
  private readonly api = environment.apiUrl;
  constructor(private readonly http: HttpClient) {}

  summary(petId: number, from: string, to: string): Observable<VeterinarySummary> {
    return this.http.get<VeterinarySummary>(`${this.api}/pets/${petId}/veterinary-summary`, { params: { from, to } });
  }
  createShare(request: VeterinaryShareRequest): Observable<VeterinaryShareCreated> {
    return this.http.post<VeterinaryShareCreated>(`${this.api}/veterinary-shares`, request);
  }
  shares(petId?: number): Observable<VeterinaryShare[]> {
    return this.http.get<VeterinaryShare[]>(`${this.api}/veterinary-shares`, { params: petId ? { petId } : {} });
  }
  revoke(share: VeterinaryShare): Observable<void> {
    return this.http.delete<void>(`${this.api}/veterinary-shares/${encodeURIComponent(share.id)}`, { params: { version: share.version } });
  }
  publicSummary(token: string): Observable<PublicVeterinarySummary> {
    return this.http.post<PublicVeterinarySummary>(`${this.api}/public/veterinary-summary`, { token });
  }
  sharedAttachmentUrl(token: string, mediaId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.api}/public/veterinary-summary/attachment-url`, { token, mediaId });
  }
  attachmentUrl(mediaId: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.api}/health-attachments/${encodeURIComponent(mediaId)}/download-url`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardOverview } from '../models/dashboard.model';
import { CacheKeys } from './cache-keys';
import { CacheService } from './cache.service';
import { MediaService } from './media.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient, private cache: CacheService, private media: MediaService) {}

  getOverview(forceRefresh = false): Observable<DashboardOverview> {
    if (forceRefresh) this.cache.invalidate(CacheKeys.dashboard);
    return this.cache.get(
      CacheKeys.dashboard,
      () => this.http.get<DashboardOverview>(this.url).pipe(map(overview => {
        const normalized: DashboardOverview = {
          ...overview,
          pets: overview.pets.map(pet => {
            const item = { ...pet };
            const photoUrl = this.media.contentUrl(pet.photoAssetId, pet.photoUrl);
            if (photoUrl) item.photoUrl = photoUrl;
            else delete item.photoUrl;
            return item;
          })
        };
        const avatar = this.media.contentUrl(overview.avatarAssetId, overview.avatar);
        if (avatar) normalized.avatar = avatar;
        return normalized;
      })),
      60_000
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TutorDetailResult, TutorsPageResult } from '../../shared/models/tutor.model';
import { UpdateRequest } from '../../shared/models/auth.model';
import { PageRequest } from '../../shared/models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  private readonly API_URL = `${environment.apiUrl}/tutors`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<TutorDetailResult> {
    return this.http.get<TutorDetailResult>(`${this.API_URL}/me`);
  }

  updateProfile(id: number, data: UpdateRequest): Observable<TutorDetailResult> {
    return this.http.put<TutorDetailResult>(`${this.API_URL}/${id}`, data);
  }

  deleteProfile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getTutors(pageRequest?: PageRequest): Observable<TutorsPageResult> {
    let params = new HttpParams();
    if (pageRequest?.page !== undefined) {
      params = params.set('page', pageRequest.page.toString());
    }
    if (pageRequest?.size !== undefined) {
      params = params.set('size', pageRequest.size.toString());
    }
    
    return this.http.get<TutorsPageResult>(this.API_URL, { params });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pet, PetCreateRequest, PetUpdateRequest, PetsPage, PetSummary } from '../models/pet.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private apiUrl = `${environment.apiUrl}/pets`;

  constructor(private http: HttpClient) { }

  getAll(page: number, size: number): Observable<PetsPage> {
    return this.http.get<PetsPage>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getById(id: number): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  create(pet: PetCreateRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, pet);
  }

  update(id: number, pet: PetUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, pet);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getPets(): Observable<PetSummary[]> {
    // Fetch all pets - adjust page size if you have more than 100 pets
    return this.http.get<PetsPage>(`${this.apiUrl}?page=0&size=100`).pipe(
      map(page => page.items)
    );
  }
}

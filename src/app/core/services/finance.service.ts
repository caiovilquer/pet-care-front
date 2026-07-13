import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ExpenseCategory, ExpenseRequest, ExpensesPage, FinanceOverview } from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly api = environment.apiUrl;
  constructor(private readonly http: HttpClient) {}

  overview(from: string, to: string, forecastTo: string, petId?: number | null): Observable<FinanceOverview> {
    let params = new HttpParams().set('from', from).set('to', to).set('forecastTo', forecastTo);
    if (petId) params = params.set('petId', petId);
    return this.http.get<FinanceOverview>(`${this.api}/finances/overview`, { params });
  }
  expenses(from: string, to: string, petId?: number | null, category?: ExpenseCategory | null, page = 0, size = 50): Observable<ExpensesPage> {
    let params = new HttpParams().set('from', from).set('to', to).set('page', page).set('size', size);
    if (petId) params = params.set('petId', petId);
    if (category) params = params.set('category', category);
    return this.http.get<ExpensesPage>(`${this.api}/expenses`, { params });
  }
  create(request: ExpenseRequest): Observable<Expense> { return this.http.post<Expense>(`${this.api}/expenses`, request); }
  update(expense: Expense, request: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.api}/expenses/${encodeURIComponent(expense.id)}`, { ...request, version: expense.version });
  }
  delete(expense: Expense): Observable<void> {
    return this.http.delete<void>(`${this.api}/expenses/${encodeURIComponent(expense.id)}`, { params: { version: expense.version } });
  }
}

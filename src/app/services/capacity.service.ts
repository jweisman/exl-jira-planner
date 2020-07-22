import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacity } from '../models/planner';
import { environment } from 'src/environments/environment';
import { Observable, iif, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CapacityService {
  _capacity: Capacity;

  constructor(
    private http: HttpClient
  ) { }

  get(): Observable<Capacity> {
    return iif(
      ()=>this._capacity!=null,
      of(this._capacity),
      this.http.get<Capacity>(`${environment.serviceUrl}/capacity`)
      .pipe(tap(capacity => this._capacity = capacity))
    )
  }

  set(capacity: Capacity): Observable<void> {
    this._capacity = capacity;
    return this.http.post<void>(`${environment.serviceUrl}/capacity`, capacity);
  }
}

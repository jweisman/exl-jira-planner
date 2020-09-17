import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacity } from '../models/planner';
import { environment } from 'src/environments/environment';
import { Observable, iif, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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
      .pipe(
        /* migration */
        map(capacity => {
          if (["string", "number"].includes(typeof Object.values(Object.values(capacity)[0])[0])) {
            Object.keys(capacity).forEach(t=>{
              Object.keys(capacity[t]).forEach(v=>{
                let dev = (capacity[t][v] as unknown) as string;
                capacity[t][v] = { dev: dev, support: "0" }
              })
            })
          }
          return capacity;
        }),
        tap(capacity => this._capacity = capacity)
      )
    )
  }

  set(capacity: Capacity): Observable<void> {
    this._capacity = capacity;
    return this.http.post<void>(`${environment.serviceUrl}/capacity`, capacity);
  }
}

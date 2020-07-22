import { Injectable } from '@angular/core';
import { expand, map, reduce } from 'rxjs/operators';
import { empty, Observable } from 'rxjs';
import { JiraHttpClient } from './httpClient';
import { Version } from '../models/jira';
import { HttpParams } from '@angular/common/http';

const NUM_OF_SPRINTS = 9;
const MAX_ISSUES = 200;

@Injectable({
  providedIn: 'root'
})
export class JiraService {

  constructor(
    private http: JiraHttpClient
  ) { }

  getVersions(): Observable<Array<Version>> {
    return this.http.get<any>('/project/URM/version?orderBy=sequence').pipe(
      expand( response => response.isLast ? empty() : this.http.get<any>(response.nextPage)),
      map( obj => obj.values ),
      reduce((acc, x) => acc.concat(x), []),
      map( versions => versions.filter(v=>!v.released && /^\d{6}/.test(v.name)).slice(0,NUM_OF_SPRINTS))
    )
  }

  getIssues(user: string, versions: Array<Version>) {
    let params = new HttpParams()
      .set('jql', `project = URM and fixVersion in (${versions.map(v=>v.id).join(',')}) and issuetype in (Story, Task) and assignee = ${user}`)
      .set('maxResults', MAX_ISSUES.toString());
    return this.http.get<any>('/search', { params: params }).pipe(
      expand( response => response.startAt + response.issues.length >= response.total ? empty() : this.http.get<any>('/search', {params: params.set('startAt', response.startAt + MAX_ISSUES)})),
      map( obj => obj.issues ),
      reduce((acc, x) => acc.concat(x), []),
      /* Filter out defect allocations */
      map(issues=>issues.filter(i=>!(i.fields.issuetype.id==3 && /defect/i.test(i.fields.summary))))
    )
  }

}

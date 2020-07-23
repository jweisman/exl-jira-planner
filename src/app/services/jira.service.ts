import { Injectable, Component } from '@angular/core';
import { expand, map, reduce, catchError } from 'rxjs/operators';
import { empty, Observable, of } from 'rxjs';
import { JiraHttpClient } from './httpClient';
import { Version } from '../models/jira';
import { HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

const NUM_OF_SPRINTS = 9;
const ISSUES_BULK_SIZE = 200;

@Injectable({
  providedIn: 'root'
})
export class JiraService {

  constructor(
    private http: JiraHttpClient,
    private dialog: MatDialog
  ) { }

  getVersions(): Observable<Array<Version>> {
    return this.withErrorChecking(this.http.get<any>('/project/URM/version?orderBy=sequence')).pipe(
      expand( response => response.isLast ? empty() : this.http.get<any>(response.nextPage)),
      map( obj => obj.values ),
      reduce((acc, x) => acc.concat(x), []),
      map( versions => versions.filter(v=>!v.released && /^\d{6}/.test(v.name)).slice(0,NUM_OF_SPRINTS))
    )
  }

  getIssues(user: string, versions: Array<Version>) {
    let params = new HttpParams()
      .set('jql', `project = URM and fixVersion in (${versions.map(v=>v.id).join(',')}) and issuetype in (Story, Task) and assignee = ${user}`)
      .set('maxResults', ISSUES_BULK_SIZE.toString());
    return this.withErrorChecking(this.http.get<any>('/search', { params: params })).pipe(
      expand( response => response.startAt + response.issues.length >= response.total ? empty() : this.http.get<any>('/search', {params: params.set('startAt', response.startAt + ISSUES_BULK_SIZE)})),
      map( obj => obj.issues ),
      reduce((acc, x) => acc.concat(x), []),
      /* Filter out defect allocations */
      map(issues=>issues.filter(i=>!(i.fields.issuetype.id==3 && /defect/i.test(i.fields.summary))))
    )
  }

  getUser(user: string) {
    return this.withErrorChecking(this.http.get<any>(`/user?username=${user}`))
  }

  updateFixVersion(key: string, id: string) {
    const body = {"update":{"fixVersions":[{"set": [ {"id":id}]}]}};
    return this.http.put(`/issue/${key}`, body);
  }

  withErrorChecking = (obs: Observable<any>) => 
    obs.pipe(catchError(err=>{
      if ([404,401].includes(err.status)) {
        this.dialog.open(JiraAuthenticationDialog, { width: '400px' });
        return of(null)
      } else  {
        throw(err);
      }
    }))
}

@Component({
  selector: 'dialog-elements-example-dialog',
  template: `<h1 mat-dialog-title>Problem Connecting to Jira</h1>
  <div mat-dialog-content>There was a problem connecting to Jira. To ensure access, please click the connect button below and log in to Jira. Once you're logged in, click Refresh to try again.</div>
  <div mat-dialog-actions>
    <button mat-button (click)="connect()">Connect</button>
    <button mat-button (click)="refresh()">Refresh</button>
    <button mat-button mat-dialog-close>Close</button>
  </div>`,
})
export class JiraAuthenticationDialog {
  connect() {
    console.log('connect')
    window.open(environment.jiraUrl, "_blank");
  }

  refresh() {
    location.reload();
  }
}
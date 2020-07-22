import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { switchMap, tap, finalize } from 'rxjs/operators';
import { JiraHttpClient } from '../services/httpClient';
import { forkJoin } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSelectChange } from '@angular/material/select';
import { Issues, Teams, Capacity } from '../models/planner';
import { JiraService } from '../services/jira.service';
import { CapacityService } from '../services/capacity.service';
import { Version } from '../models/jira';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss'],
})
export class PlannerComponent implements OnInit {
  versions: Array<Version> = [];
  issues: Issues;
  teams: Teams = {};
  loading = false;
  selectedTeam: string;
  jiraHost = environment.jiraUrl;
  capacity: Capacity;

  constructor(
    private http: JiraHttpClient,
    private jira: JiraService,
    private capacityService: CapacityService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.capacityService.get().pipe(
      tap( capacity => this.capacity = capacity ),
      switchMap( () => forkJoin(Object.keys(this.capacity).map(user=>this.http.get<any>(`/user?username=${user}`)))),
      tap(results => {
        results.forEach( user => {
          this.teams[user.key] = {
            displayName: user.displayName,
            capacity: this.capacity[user.key]
          }
        })
      }),
      switchMap( () => this.jira.getVersions()),
      tap( results => {
        this.versions = results;
        this.issues = {};
        this.versions.forEach(v=>this.issues[v.id]=[]);
      }),
    )
    .subscribe({
      error: err => this.toastr.error('Error retrieving data')
    });
  }

  selectTeam(event: MatSelectChange) {
    this.selectedTeam = event.value;
    this.loading = true;
    this.jira.getIssues(event.value, this.versions).pipe(
      finalize(()=>this.loading = false)
    )
    .subscribe(issues=>{
      issues.forEach( issue => {
        const fixVersion = Array.isArray(issue.fields.fixVersions) 
          && issue.fields.fixVersions.length > 0 
          && issue.fields.fixVersions[0].id;
        this.issues[fixVersion].push(issue)
      })
    });
  }

  sum(versionId: string): number {
    return this.issues[versionId] ? this.issues[versionId].map(issue=>issue.fields.customfield_10132).reduce((a, b) => a + b, 0) : 0;
  }

  teamCapacity(versionId: string): number {
    if (!this.selectedTeam) return 0;
    const throughput = this.teams[this.selectedTeam].capacity[versionId];
    return throughput ? parseInt(throughput) : 0;
  } 

  status(versionId: string) {
    const status = this.sum(versionId) / this.teamCapacity(versionId);
    if (this.sum(versionId) == 0) {
      return 'white';
    } else if (status <=1.1) {
      return '#04ff00ad';
    } else if (status > 1.1 && status < 1.2) {
      return '#ffd400ad';
    } else {
      return '#ff0000ad';
    }
  }

  get teamleaders() {
    return Object.keys(this.teams);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data, 
        event.previousIndex, 
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }


  /*
  login() {
    let auth = localStorage.getItem(JIRA_AUTH_STORAGE);
    if (!auth) {
      window.open(environment.jiraLoginUrl + '/sessions/connect' , "_blank", WINDOW_PROPS);
    } else {
      console.log('found');
      this.jiraAuth = JSON.parse(auth);
    }
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    if (environment.jiraLoginUrl.startsWith(event.origin)) {
      console.log('matches');
      localStorage.setItem(JIRA_AUTH_STORAGE, JSON.stringify(event.data));
      this.jiraAuth = event.data;
    }
  }  
  */
}

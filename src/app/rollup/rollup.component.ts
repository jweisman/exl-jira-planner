import { Component, OnInit, ViewChild } from '@angular/core';
import { SelectTeamComponent } from '../select-team/select-team.component';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { JiraService } from '../services/jira.service';
import { forkJoin } from 'rxjs';
import { Version, quarterRegEx } from '../models/jira';
import { Issues } from '../models/planner';
import { PreferencesService } from '../services/preferences.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-rollup',
  templateUrl: './rollup.component.html',
  styleUrls: ['./rollup.component.scss']
})
export class RollupComponent implements OnInit {
  loading = false;
  versions: Array<Version>;
  issues: Issues;
  estimateField = environment.estimateField;
  quarters: { [year: string]: {[quarter: number]: Array<Version>} } = 
    {
      [new Date().getFullYear()]: {},
      [new Date().getFullYear()+1]: {}
    }
  @ViewChild(SelectTeamComponent) selectTeam: SelectTeamComponent;

  constructor(
    private toastr: ToastrService,
    private jira: JiraService,
    private prefService: PreferencesService,
  ) { }

  ngOnInit() {
    this.loading = true;
  }

  ngAfterViewInit() {
    this.selectTeam.onTeamSelected.subscribe(this.getRollup);
    this.selectTeam.init().pipe(
      switchMap(() => this.getVersions()),
      finalize(()=>this.loading=false)
    )
    .subscribe({
      error: err => this.toastr.error(`Error retrieving data: ${err.message}`)
    });
  }

  getVersions() {
    return forkJoin(Object.keys(this.quarters).map(year=>this.jira.getRollupVersions(year))).pipe(
      tap(versions => {
        this.versions = [].concat(...versions),
        this.issues = {};
        this.versions.forEach(v=>this.issues[v.id]=[]);
      }),
      tap(versions => {
        Object.keys(this.quarters).forEach((year, i) => {
          [1,2,3,4].forEach(q=>{
            this.quarters[year][q] = versions[i].filter(v=>quarterRegEx(year, q).test(v.name));
          })
        })
      }),
    )
  }

  getRollup = (team: string) => {
    this.loading = true;
    /* Clear issue arrays */
    Object.keys(this.issues).forEach(id=>this.issues[id]=[]);

    this.jira.getIssues(team, this.versions).pipe(
      finalize(()=>this.loading = false)
    )
    .subscribe(issues=>{
      issues.forEach( issue => {
        const fixVersion = Array.isArray(issue.fields.fixVersions) 
          && issue.fields.fixVersions.length > 0 
          && issue.fields.fixVersions[0].id;
        this.issues[fixVersion].push(issue)
      })
    })
  }

  sum(versionIds: string[]): number {
    let issues = [].concat(...Object.entries(this.issues).filter(([key, value])=>versionIds.includes(key)).map(([key, value]) => value));
    return issues.map(issue=>issue.fields[this.estimateField]).reduce((a, b) => a + b, 0) 
  }

  teamCapacity(versionIds: string[]): number {
    if (!this.selectTeam.selectedTeam) return 0;
    return Object.entries(this.selectTeam.teams[this.selectTeam.selectedTeam].capacity)
    .filter(([key, value])=>versionIds.includes(key)).map(([key, value]) => parseInt(value) || 0).reduce((a, b) => a + b, 0)
  }

  versionsQ(year: string, q: number = 0) {  
    const regex = q == 0 ? new RegExp(`^${year}`) : quarterRegEx(year, q);
    return this.versions.filter(v=>regex.test(v.name))
    .map(v=>v.id.toString());
  }

  status(versionIds: string[]) {
    return this.sum(versionIds) == 0
      ? 'white'
      : this.prefService.status(this.sum(versionIds) / this.teamCapacity(versionIds));
  }

  get years() {
    return Object.keys(this.quarters);
  }

}
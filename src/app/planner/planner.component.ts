import { Component, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { switchMap, tap, finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Issues } from '../models/planner';
import { JiraService } from '../services/jira.service';
import { Version, Issue } from '../models/jira';
import { ToastrService } from 'ngx-toastr';
import { MatMenuTrigger } from '@angular/material/menu';
import { PreferencesService } from '../services/preferences.service';
import { SelectTeamComponent } from '../select-team/select-team.component';

@Component({
  selector: 'app-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss'],
})
export class PlannerComponent implements OnInit {
  versions: Array<Version> = [];
  issues: Issues;
  loading = false;
  jiraHost = environment.jiraUrl;
  estimateField = environment.estimateField;
  @ViewChild(SelectTeamComponent) selectTeam: SelectTeamComponent;
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;
  contextMenuPosition = { x: '0px', y: '0px' };
  issuesToUpdate: { [key: string]: string } = {};

  constructor(
    private jira: JiraService,
    private toastr: ToastrService,
    private prefService: PreferencesService
  ) { }

  ngOnInit() {
    this.loading = true;
  }

  ngAfterViewInit() {
    this.selectTeam.onTeamSelected.subscribe(this.loadIssues);
    this.selectTeam.init().pipe(
      switchMap(() => this.getVersions()),
      finalize(()=>this.loading=false)
    )
    .subscribe({
      error: err => this.toastr.error(`Error retrieving data: ${err.message}`)
    });
  }

  getVersions() {
    return this.jira.getVersions(this.prefService.preferences.numOfVersions).pipe(
      tap( results => {
        this.versions = results;
        this.issues = {};
        this.versions.forEach(v=>this.issues[v.id]=[]);
      })
    );
  }

  loadIssues = (team: string) => {
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
    });
  }

  sum(versionId: string): number {
    return this.issues[versionId] ? this.issues[versionId].map(issue=>issue.fields[this.estimateField]).reduce((a, b) => a + b, 0) : 0;
  }

  teamCapacity(versionId: string): number {
    if (!this.selectTeam.selectedTeam) return 0;
    const throughput = this.selectTeam.teams[this.selectTeam.selectedTeam].capacity[versionId];
    return throughput ? parseInt(throughput) : 0;
  } 

  status(versionId: string) {
    const status = this.sum(versionId) / this.teamCapacity(versionId);
    return this.sum(versionId) == 0 ? 'white' : this.prefService.status(status);
  }

  drop(event: CdkDragDrop<Issue[]>) {
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
      this.issuesToUpdate[event.container.data[event.currentIndex].key] = event.container.element.nativeElement.dataset.versionid;
    }
  }

  onContextMenu(event: MouseEvent, issueIndex: number, versionId: number) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { issueIndex, versionId };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  onMoveVersion(versionId: string) {
    if (this.issues[this.contextMenu.menuData.versionId] == this.issues[versionId])
      return;

    const newIndex = this.issues[versionId].length;
    transferArrayItem(
      this.issues[this.contextMenu.menuData.versionId],
      this.issues[versionId],
      this.contextMenu.menuData.issueIndex,
      newIndex
    );
    this.issuesToUpdate[this.issues[versionId][newIndex].key] = versionId;
  }

  update() {
    this.loading = true;
    forkJoin(Object.entries(this.issuesToUpdate).map(([key, value])=>this.jira.updateFixVersion(key, value)))
    .pipe(finalize(()=>this.loading = false))
    .subscribe({
      next: () => {
        this.toastr.success(`Successfully updated ${Object.keys(this.issuesToUpdate).length} issue(s)`);
        this.issuesToUpdate = {};
        setTimeout(() => this.loadIssues(this.selectTeam.selectedTeam), 1000);
      },
      error: err => this.toastr.error("Error updated issues: " + err.message)
    })
  }

  get ready() {
    return Object.keys(this.issuesToUpdate).length != 0;
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { environment } from 'src/environments/environment';
import { MatTabGroup } from '@angular/material/tabs';
import { PlannerComponent } from '../planner/planner.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  user: any
  jiraHome = environment.jiraUrl;
  plannerTab = 0;
  @ViewChild(MatTabGroup) tabs: MatTabGroup;
  @ViewChild(PlannerComponent) planner: PlannerComponent;

  constructor(
    private jira: JiraService
  ) { }

  ngOnInit() {
    this.jira.getCurrentUser().subscribe(user=>this.user=user);
  }

  get authenticated() {
    return !!this.jira.auth;
  }

  logout() {
    this.jira.logout();
    location.reload();
  }

  selectedIndexChange(evt: any) {
    if(evt === this.plannerTab) return;
    if (this.planner && Object.keys(this.planner.issuesToUpdate).length > 0) {
      if (!confirm('Discard unsaved changes?')) {
        this.tabs.selectedIndex = this.plannerTab;
      }
    }
  }
}

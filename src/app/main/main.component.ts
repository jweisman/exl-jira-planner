import { Component, OnInit } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  user: any
  jiraHome = environment.jiraUrl;

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
}

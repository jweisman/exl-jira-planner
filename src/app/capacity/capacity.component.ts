import { Component, OnInit, ViewChild } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { Version } from '../models/jira';
import { CapacityService } from '../services/capacity.service';
import { Capacity } from '../models/planner';
import { tap, switchMap, finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { PreferencesService } from '../services/preferences.service';

@Component({
  selector: 'app-capacity',
  templateUrl: './capacity.component.html',
  styleUrls: ['./capacity.component.scss']
})
export class CapacityComponent implements OnInit {
  versions: Array<Version>;
  capacity: Capacity;
  loading = false;
  @ViewChild('form') form: any;

  constructor(
    private jira: JiraService,
    private capacityService: CapacityService,
    private toastr: ToastrService,
    private prefService: PreferencesService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.capacityService.get().pipe(
      tap(capacity => this.capacity = capacity),
      switchMap(() => this.jira.getVersions(this.prefService.preferences.numOfVersions)),
      tap(versions => this.versions = versions),
      finalize(()=>this.loading=false)
    ).subscribe({
      error: err => this.toastr.error('Error retrieving data')
    });
  }

  add() {
    const username = prompt("Team leader username");
    if (username && !this.capacity[username]) {
      this.capacity[username] = {};
    }
  }

  delete(team: string) {
    if (confirm(`Are you sure you wish to delete capacity for ${team}?`)) {
      delete this.capacity[team];
    }
  }

  edit(team: string) {
    const username = prompt("New team leader username");
    if (username && !this.capacity[username]) {
      //this.capacity[team] = this.capacity[username];
      //delete this.capacity[team];
      delete Object.assign(this.capacity, {[username]: this.capacity[team] })[team]
    }
  }

  save() {
    this.loading = true;
    this.capacityService.set(this.capacity)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => this.toastr.success('Capacity settings saved.'),
      error: err => this.toastr.error('Could not save capacity settings: ' + err.message),
    });
  }

  get teams() {
    return Object.keys(this.capacity);
  }
}

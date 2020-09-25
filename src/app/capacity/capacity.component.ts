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
      next: () => {
        // Ensure all versions in  capacity
        Object.values(this.capacity).forEach( capacity => {
          this.versions.forEach(version=>{
            if (!capacity[version.id]) capacity[version.id] = {support: null, dev: null};
          })
        })
      },
      error: err => this.toastr.error('Error retrieving data')
    });
  }

  add() {
    const username = prompt("Team leader username");
    if (username) {
      if (this.capacity[username]) {
        return this.toastr.warning(`User ${username} already defined`)
      }
      this.jira.getUser(username).subscribe({
        next: () => this.capacity[username] = {},
        error: e => this.toastr.warning(`User ${username} could not be found`)
      })
    }
  }

  delete(team: string) {
    if (confirm(`Are you sure you wish to delete capacity for ${team}?`)) {
      delete this.capacity[team];
    }
  }

  edit(team: string) {
    const username = prompt("New team leader username");
    if (username) {
      if (this.capacity[username]) {
        return this.toastr.warning(`User ${username} already defined`)
      }
      this.jira.getUser(username).subscribe({
        next: () => delete Object.assign(this.capacity, {[username]: this.capacity[team] })[team],
        error: e => this.toastr.warning(`User ${username} could not be found`)
      })
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

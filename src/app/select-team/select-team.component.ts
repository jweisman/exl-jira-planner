import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Teams, Capacity } from '../models/planner';
import { FormControl } from '@angular/forms';
import { CapacityService } from '../services/capacity.service';
import { tap, switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { JiraService } from '../services/jira.service';

@Component({
  selector: 'app-select-team',
  templateUrl: './select-team.component.html',
  styleUrls: ['./select-team.component.scss']
})
export class SelectTeamComponent implements OnInit {
  @Output() teams: Teams = {};
  _selectedTeam: FormControl = new FormControl('');
  @Output() capacity: Capacity;
  @Output() onTeamSelected: EventEmitter<string> = new EventEmitter();

  constructor(
    private capacityService: CapacityService,
    private jira: JiraService,
  ) { }

  ngOnInit() {
    this._selectedTeam.valueChanges
        .subscribe(val => this.onTeamSelected.emit(val));
  }

  init() {
    return this.capacityService.get().pipe(
      tap( capacity => this.capacity = capacity ),
      switchMap( () => forkJoin(Object.keys(this.capacity).map(user=>this.jira.getUser(user)))),
      tap(results => {
        results.forEach( user => {
          this.teams[user.key] = {
            displayName: user.displayName,
            capacity: this.capacity[user.key]
          }
        })
      })
    )
  }

  get selectedTeam(): string {
    return this._selectedTeam.value;
  }

  get teamleaders() {
    return Object.keys(this.teams);
  }

}

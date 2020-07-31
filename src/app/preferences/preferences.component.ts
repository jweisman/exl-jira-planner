import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PreferencesService } from '../services/preferences.service';
import { preferencesFormGroup } from './preferences-utils';
import { debounceTime, pairwise } from 'rxjs/operators';
import { Threshold } from '../models/preferences';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit {
  form: FormGroup;

  constructor(
    private prefService: PreferencesService
  ) { }

  ngOnInit() {
    this.form = preferencesFormGroup(this.prefService.preferences);
    this.form.valueChanges.pipe(debounceTime(500))
    .subscribe(value=>{
      this.prefService.preferences = value;
      console.log('saved')
    });
    this.form.controls.threshold.valueChanges.pipe(pairwise())
    .subscribe(this.onThresholdChange)
  }

  onThresholdChange = ([prev, next]: [Threshold, Threshold]) => {
    if (next.green >= next.red) {
      this.form.patchValue({threshold: prev})
    }
  }

}

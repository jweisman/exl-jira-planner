import { Preferences } from '../models/preferences';
import { FormGroup, FormControl } from '@angular/forms';

export const preferencesFormGroup = (preferences: Preferences): FormGroup => {
  return new FormGroup({
    numOfVersions: new FormControl(preferences.numOfVersions),
    threshold: new FormGroup({
      green: new FormControl(preferences.threshold.green),
      red: new FormControl(preferences.threshold.red)
    }),
    includeBuckets: new FormControl(preferences.includeBuckets)
  })
}
import { Injectable } from '@angular/core';
import { Preferences } from '../models/preferences';
import { statusColors } from '../models/planner';

const PREFERENCES_STORAGE_KEY = 'JiraPlannerPreferences';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private _preferences: Preferences;

  constructor() {
    const pref = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (pref) {
      this._preferences = JSON.parse(pref)
    } else {
      this._preferences = new Preferences();
    }
  }

  get preferences() {
    return this._preferences;
  }

  set preferences(pref: Preferences) {
    this._preferences = pref;
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(pref));
  }

  status(status: number) {
    if (status <= this.preferences.threshold.green) {
      return statusColors.green;
    } else if (status > this.preferences.threshold.green 
      && status <= this.preferences.threshold.red) {
      return statusColors.yellow;
    } else {
      return statusColors.red;
    }
  }
}
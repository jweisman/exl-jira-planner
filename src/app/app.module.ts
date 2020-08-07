import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PlannerComponent } from './planner/planner.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { JiraHttpClient, jiraHttpClientCreator } from './services/httpClient';
import { CapacityComponent } from './capacity/capacity.component';
import { JiraService, JiraAuthenticationDialog } from './services/jira.service';
import { CapacityService } from './services/capacity.service';
import { MainComponent } from './main/main.component';
import { PreferencesService } from './services/preferences.service';
import { RollupComponent } from './rollup/rollup.component';
import { SelectTeamComponent } from './select-team/select-team.component';

@NgModule({
   declarations: [
      AppComponent,
      PlannerComponent,
      CapacityComponent,
      PreferencesComponent,
      MainComponent,
      RollupComponent,
      SelectTeamComponent,
      JiraAuthenticationDialog,
   ],
   imports: [
      BrowserModule,
      AppRoutingModule,
      BrowserAnimationsModule,
      ToastrModule.forRoot(),
      DragDropModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule,
      MatTabsModule,
      MatSelectModule,
      MatProgressSpinnerModule,
      MatButtonModule,
      MatMenuModule,
      MatDialogModule,
      MatIconModule,
      MatExpansionModule,
      MatCheckboxModule,
      MatCardModule,
   ],
   providers: [
      {
         provide: JiraHttpClient,
         useFactory: jiraHttpClientCreator,
         deps: [HttpClient]
      },
      JiraService,
      CapacityService,
      PreferencesService,
   ],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }

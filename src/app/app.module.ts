import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';

import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PlannerComponent } from './planner/planner.component';
import { JiraHttpClient, jiraHttpClientCreator } from './services/httpClient';
import { CapacityComponent } from './capacity/capacity.component';
import { JiraService } from './services/jira.service';
import { FormsModule } from '@angular/forms';
import { CapacityService } from './services/capacity.service';
import { MainComponent } from './main/main.component';

@NgModule({
   declarations: [
      AppComponent,
      PlannerComponent,
      CapacityComponent,
      MainComponent
   ],
   imports: [
      BrowserModule,
      AppRoutingModule,
      BrowserAnimationsModule,
      ToastrModule.forRoot(),
      DragDropModule,
      FormsModule,
      HttpClientModule,
      MatTabsModule,
      MatSelectModule,
      MatProgressSpinnerModule,
      MatButtonModule
   ],
   providers: [
      {
         provide: JiraHttpClient,
         useFactory: jiraHttpClientCreator,
         deps: [HttpClient]
      },
      JiraService,
      CapacityService,
   ],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HelpModule } from '../help/help.module';
import { SharedModule } from '../shared/shared.module';
import { D3ChoroplethMapComponent } from './d3-choropleth-map/d3-choropleth-map.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { EbrakeModule } from './ebrake/ebrake.module';
import { OverviewBedComponent } from './overview-bed/overview-bed.component';
import { OverviewCaseComponent } from './overview-case/overview-case.component';
import { OverviewIntroductionComponent } from './overview-introduction/overview-introduction.component';
import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';
import { SubscriptionComponent } from './subscription/subscription.component';



@NgModule({
  declarations: [
    OverviewComponent,
    OverviewBedComponent,
    D3ChoroplethMapComponent,
    OverviewCaseComponent,
    OverviewIntroductionComponent,
    SubscriptionComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SharedModule.forRoot(),
    OverviewRoutingModule,
    MatGridListModule,
    MatToolbarModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    HelpModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSnackBarModule,
    DashboardModule,
    EbrakeModule
  ],
  providers: [
  ],
  exports: [
    OverviewComponent
  ]
})
export class OverviewModule { }

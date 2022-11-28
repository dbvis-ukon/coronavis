import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
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

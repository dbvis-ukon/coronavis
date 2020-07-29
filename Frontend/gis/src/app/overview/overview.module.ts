import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HelpModule } from '../help/help.module';
import { SharedModule } from '../shared/shared.module';
import { D3ChoroplethMapComponent } from './d3-choropleth-map/d3-choropleth-map.component';
import { OverviewBedComponent } from './overview-bed/overview-bed.component';
import { OverviewCaseComponent } from './overview-case/overview-case.component';
import { OverviewIntroductionComponent } from './overview-introduction/overview-introduction.component';
import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [
    OverviewComponent,
    OverviewBedComponent,
    D3ChoroplethMapComponent,
    OverviewCaseComponent,
    OverviewIntroductionComponent,
  ],
  imports: [
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
    MatIconModule
  ],
  providers: [
  ],
  exports: [
    OverviewComponent
  ]
})
export class OverviewModule { }

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SharedModule } from '../shared/shared.module';
import { D3ChoroplethMapComponent } from './d3-choropleth-map/d3-choropleth-map.component';
import { OverviewBedComponent } from './overview-bed/overview-bed.component';
import { OverviewCaseComponent } from './overview-case/overview-case.component';
import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';



@NgModule({
  declarations: [
    OverviewComponent,
    OverviewBedComponent,
    D3ChoroplethMapComponent,
    OverviewCaseComponent,
  ],
  imports: [
    CommonModule,
    SharedModule.forRoot(),
    OverviewRoutingModule,
    MatGridListModule,
    MatToolbarModule,
    MatButtonModule
  ],
  providers: [
  ],
  exports: [
    OverviewComponent
  ]
})
export class OverviewModule { }

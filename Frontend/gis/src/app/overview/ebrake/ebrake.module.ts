import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { EbrakeTooltipComponent } from './ebrake-tooltip/ebrake-tooltip.component';
import { TemporalOverviewChartComponent } from './temporal-overview-chart/temporal-overview-chart.component';
import { TemporalOverviewComponent } from './temporal-overview/temporal-overview.component';



@NgModule({
  declarations: [
    TemporalOverviewComponent,
    TemporalOverviewChartComponent,
    EbrakeTooltipComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    TemporalOverviewComponent
  ]
})
export class EbrakeModule { }

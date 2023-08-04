import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { EbrakeShareDialogComponent } from './ebrake-share-dialog/ebrake-share-dialog.component';
import { EbrakeTooltipComponent } from './ebrake-tooltip/ebrake-tooltip.component';
import { TemporalOverviewChartComponent } from './temporal-overview-chart/temporal-overview-chart.component';
import { TemporalOverviewComponent } from './temporal-overview/temporal-overview.component';



@NgModule({
  declarations: [
    TemporalOverviewComponent,
    TemporalOverviewChartComponent,
    EbrakeTooltipComponent,
    EbrakeShareDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDialogModule,
    TextFieldModule,
    MatButtonToggleModule
  ],
  exports: [
    TemporalOverviewComponent
  ]
})
export class EbrakeModule { }

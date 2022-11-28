import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
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

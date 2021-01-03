import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { CaseDialogComponent } from './case-dialog/case-dialog.component';
import { CaseInfoComponent } from './case-info/case-info.component';
import { CaseTooltipComponent } from './case-tooltip/case-tooltip.component';
import { SharedModule } from '../shared/shared.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CaseAgegroupChartComponent } from './case-agegroup-chart/case-agegroup-chart.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CaseLineChartComponent } from './case-line-chart/case-line-chart.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CaseTableComponent } from './case-table/case-table.component';



@NgModule({
  declarations: [
    CaseDialogComponent,
    CaseInfoComponent,
    CaseTooltipComponent,
    CaseAgegroupChartComponent,
    CaseLineChartComponent,
    CaseTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule.forRoot(),
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatTooltipModule
  ]
})
export class CasesDodModule { }

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { CaseDialogComponent } from './case-dialog/case-dialog.component';
import { CaseInfoComponent } from './case-info/case-info.component';
import { CaseLineChartComponent } from './case-line-chart/case-line-chart.component';
import { CaseTooltipComponent } from './case-tooltip/case-tooltip.component';



@NgModule({
  declarations: [
    CaseDialogComponent,
    CaseInfoComponent,
    CaseTooltipComponent,
    CaseLineChartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule.forRoot(),
    RouterModule,
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

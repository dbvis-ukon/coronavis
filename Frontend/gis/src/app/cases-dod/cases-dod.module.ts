import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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

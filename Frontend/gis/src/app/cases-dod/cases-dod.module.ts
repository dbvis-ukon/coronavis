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



@NgModule({
  declarations: [
    CaseDialogComponent,
    CaseInfoComponent,
    CaseTooltipComponent
  ],
  imports: [
    CommonModule,
    SharedModule.forRoot(),
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ]
})
export class CasesDodModule { }

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { HelpDialogBedsComponent } from './help-dialog-beds/help-dialog-beds.component';
import { HelpDialogCasesComponent } from './help-dialog-cases/help-dialog-cases.component';
import { HelpDialogTheprojectComponent } from './help-dialog-theproject/help-dialog-theproject.component';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  declarations: [
    HelpDialogComponent,
    HelpDialogBedsComponent,
    HelpDialogCasesComponent,
    HelpDialogTheprojectComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatDialogModule,
    FlexLayoutModule
  ],
  exports: [
    HelpDialogComponent,
    HelpDialogBedsComponent,
    HelpDialogCasesComponent,
    HelpDialogTheprojectComponent
  ]
})
export class HelpModule { }

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { HelpDialogBedsComponent } from './help-dialog-beds/help-dialog-beds.component';
import { HelpDialogCasesComponent } from './help-dialog-cases/help-dialog-cases.component';
import { HelpDialogTheprojectComponent } from './help-dialog-theproject/help-dialog-theproject.component';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HelpDialogLiveViewComponent } from './help-dialog-live-view/help-dialog-live-view.component';



@NgModule({
  declarations: [
    HelpDialogComponent,
    HelpDialogBedsComponent,
    HelpDialogCasesComponent,
    HelpDialogTheprojectComponent,
    HelpDialogLiveViewComponent
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
    HelpDialogTheprojectComponent,
    HelpDialogLiveViewComponent
  ]
})
export class HelpModule { }

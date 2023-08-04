import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardsOverviewComponent } from './dashboards-overview/dashboards-overview.component';
import { DashboardsTableComponent } from './dashboards-table/dashboards-table.component';
import { MultiLineChartComponent } from './multi-line-chart/multi-line-chart.component';
import { SettingsComponent } from './settings/settings.component';
import { TitleEditDialogComponent } from './title-edit-dialog/title-edit-dialog.component';


@NgModule({
  declarations: [
    DashboardComponent,
    MultiLineChartComponent,
    SettingsComponent,
    TitleEditDialogComponent,
    DashboardsOverviewComponent,
    DashboardsTableComponent
  ],
  imports: [
    CommonModule,
    SharedModule.forRoot(),
    MarkdownModule.forRoot(),
    RouterModule.forChild([]),
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatDialogModule,
    DragDropModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ClipboardModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [
    DashboardComponent,
    DashboardsOverviewComponent
  ]
})
export class DashboardModule { }

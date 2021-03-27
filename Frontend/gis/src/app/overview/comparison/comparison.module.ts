import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonViewComponent } from './comparison-view/comparison-view.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { PixelChartComponent } from './pixel-chart/pixel-chart.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MultiLineChartComponent } from './multi-line-chart/multi-line-chart.component';
import { SettingsComponent } from './settings/settings.component';
import { RegionSelectorComponent } from './region-selector/region-selector.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MarkdownModule } from 'ngx-markdown';



@NgModule({
  declarations: [
    ComparisonViewComponent,
    PixelChartComponent,
    MultiLineChartComponent,
    SettingsComponent,
    RegionSelectorComponent
  ],
  imports: [
    CommonModule,
    SharedModule.forRoot(),
    MarkdownModule.forRoot(),
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
    MatButtonToggleModule
  ],
  exports: [
    ComparisonViewComponent
  ]
})
export class ComparisonModule { }

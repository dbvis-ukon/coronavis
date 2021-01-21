import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonViewComponent } from './comparison-view/comparison-view.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { PixelChartComponent } from './pixel-chart/pixel-chart.component';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [ComparisonViewComponent, PixelChartComponent],
  imports: [
    CommonModule,
    SharedModule.forRoot(),
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatDialogModule,
    DragDropModule
  ],
  exports: [
    ComparisonViewComponent
  ]
})
export class ComparisonModule { }

import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BedInlineLegendComponent } from './bed-inline-legend/bed-inline-legend.component';
import { DataSourceComponent } from './data-source/data-source.component';
import { EbrakeSnackbarComponent } from './ebrake-snackbar/ebrake-snackbar.component';
import { FooterComponent } from './footer/footer.component';
import { HospitalSearchComponent } from './hospital-search/hospital-search.component';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { PixelChartComponent } from './pixel-chart/pixel-chart.component';
import { PlusminusPipe } from './plusminus.pipe';
import { RegionSelectorComponent } from './region-selector/region-selector.component';
import { ResizedDirective } from './resize.directive';
import { StackedAreaIcuChartComponent } from './stacked-area-icu-chart/stacked-area-icu-chart.component';
import { TableOverviewComponent } from './table-overview/table-overview.component';
import { TranslatePipe } from './translate.pipe';
import { VegaComponent } from './vega/vega.component';
import { WithLoadingPipe } from './with-loading.pipe';



@NgModule({
  declarations: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent,
    WithLoadingPipe,
    BedInlineLegendComponent,
    HospitalSearchComponent,
    VegaComponent,
    DataSourceComponent,
    PixelChartComponent,
    TableOverviewComponent,
    StackedAreaIcuChartComponent,
    EbrakeSnackbarComponent,
    RegionSelectorComponent,
    FooterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatToolbarModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent,
    WithLoadingPipe,
    BedInlineLegendComponent,
    HospitalSearchComponent,
    VegaComponent,
    DataSourceComponent,
    PixelChartComponent,
    TableOverviewComponent,
    StackedAreaIcuChartComponent,
    EbrakeSnackbarComponent,
    RegionSelectorComponent,
    FooterComponent
  ],
  providers: [
    TranslatePipe,
    PlusminusPipe,
    WithLoadingPipe,
    DatePipe,
    DecimalPipe
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule
    };
  }
}

import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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

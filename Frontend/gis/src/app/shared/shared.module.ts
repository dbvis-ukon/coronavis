import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BedInlineLegendComponent } from './bed-inline-legend/bed-inline-legend.component';
import { HospitalSearchComponent } from './hospital-search/hospital-search.component';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { PlusminusPipe } from './plusminus.pipe';
import { ResizedDirective } from './resize.directive';
import { TranslatePipe } from './translate.pipe';
import { WithLoadingPipe } from './with-loading.pipe';
import { VegaComponent } from './vega/vega.component';



@NgModule({
  declarations: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent,
    WithLoadingPipe,
    BedInlineLegendComponent,
    HospitalSearchComponent,
    VegaComponent
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
    MatButtonModule
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
    VegaComponent
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

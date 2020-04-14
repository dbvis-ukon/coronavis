import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BedInlineLegendComponent } from './bed-inline-legend/bed-inline-legend.component';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { PlusminusPipe } from './plusminus.pipe';
import { ResizedDirective } from './resize.directive';
import { TranslatePipe } from './translate.pipe';
import { WithLoadingPipe } from './with-loading.pipe';



@NgModule({
  declarations: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent,
    WithLoadingPipe,
    BedInlineLegendComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent,
    WithLoadingPipe,
    BedInlineLegendComponent
  ],
  providers: [
    TranslatePipe,
    PlusminusPipe,
    WithLoadingPipe,
    DatePipe
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule
    };
  }
}

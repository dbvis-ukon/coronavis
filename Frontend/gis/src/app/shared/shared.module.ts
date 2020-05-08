import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { PlusminusPipe } from './plusminus.pipe';
import { TranslatePipe } from './translate.pipe';



@NgModule({
  declarations: [
    TranslatePipe,
    PlusminusPipe,
    LanguageSwitcherComponent,
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
    LanguageSwitcherComponent,
  ],
  providers: [
    TranslatePipe,
    PlusminusPipe,
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

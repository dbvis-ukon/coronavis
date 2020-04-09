import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { PlusminusPipe } from './plusminus.pipe';
import { ResizedDirective } from './resize.directive';
import { TranslatePipe } from './translate.pipe';



@NgModule({
  declarations: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  exports: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective,
    LanguageSwitcherComponent
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [TranslatePipe, PlusminusPipe]
    };
  }
}

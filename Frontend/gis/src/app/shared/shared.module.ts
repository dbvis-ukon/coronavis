import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { PlusminusPipe } from './plusminus.pipe';
import { ResizedDirective } from './resize.directive';
import { TranslatePipe } from './translate.pipe';



@NgModule({
  declarations: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TranslatePipe,
    PlusminusPipe,
    ResizedDirective
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

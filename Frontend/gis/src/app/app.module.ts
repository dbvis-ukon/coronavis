import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { OverlayBrandComponent } from './overlay-brand/overlay-brand.component';

@NgModule({
  entryComponents: [
    GlyphTooltipComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    GlyphTooltipComponent,
    OverlayBrandComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    OverlayModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

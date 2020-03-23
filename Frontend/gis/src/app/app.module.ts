import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { OverlayBrandComponent } from './overlay-brand/overlay-brand.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InfoboxComponent } from './infobox/infobox.component';

@NgModule({
  entryComponents: [
    GlyphTooltipComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    GlyphTooltipComponent,
    OverlayBrandComponent,
    InfoboxComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    OverlayModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

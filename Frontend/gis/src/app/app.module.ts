import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { CaseTooltipComponent } from './case-tooltip/case-tooltip.component';

@NgModule({
  entryComponents: [
    GlyphTooltipComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    GlyphTooltipComponent,
    CaseTooltipComponent
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

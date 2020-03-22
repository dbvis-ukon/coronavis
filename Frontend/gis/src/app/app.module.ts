import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { TooltipDemoComponent } from './tooltip-demo/tooltip-demo.component';
import { OverlayModule } from '@angular/cdk/overlay';

@NgModule({
  entryComponents: [
    TooltipDemoComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    TooltipDemoComponent
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

import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { CaseTooltipComponent } from './case-tooltip/case-tooltip.component';
import { OverlayBrandComponent } from './overlay-brand/overlay-brand.component';
import { OverlayMobileComponent } from './overlay-mobile/overlay-mobile.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InfoboxComponent } from './infobox/infobox.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatCardModule} from '@angular/material/card';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {MatRadioModule} from '@angular/material/radio';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import { HospitalInfoComponent } from './hospital-info/hospital-info.component';
import {MatDialogModule} from '@angular/material/dialog';
import { HospitalInfoDialogComponent } from './hospital-info-dialog/hospital-info-dialog.component';
import { LegendComponent } from './legend/legend.component';
import { PlusminusPipe } from './plusminus.pipe';
import {MatFormFieldModule} from '@angular/material/form-field';
import { AboutComponent } from './about/about.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatStepperModule } from "@angular/material/stepper";


import { VegaComponent } from './vega/vega.component';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';
import { OsmTooltipComponent } from './osm-tooltip/osm-tooltip.component';

import { registerLocaleData, DecimalPipe, APP_BASE_HREF, PlatformLocation } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';
import { SupportedLocales } from './services/i18n.service';
import { TranslatePipe } from './translate.pipe';
import { AppRoutingModule } from './app-routing.module';
import { MapRootComponent } from './map-root/map-root.component';

// the second parameter 'fr-FR' is optional
registerLocaleData(localeDe, 'de-DE');
registerLocaleData(localeEn, 'en-US');

// const storedLocale = JSON.parse(localStorage.getItem(APP_LOCALE)) as SupportedLocales;

export const localeProvider = {
  provide: LOCALE_ID,
  useFactory: (s: PlatformLocation) => {

    let locale: SupportedLocales = null;

    // get from localStorage
    // if(storedLocale) {
    //   locale = storedLocale;
    // }

    // get form base url e.g. /en/ /de/
    if(locale === null) {
      const strippedBase = s.getBaseHrefFromDOM().replace(/\//g, '');
      if(strippedBase.length === 2) {
        for(const l of Object.values(SupportedLocales)) {
          if(l.startsWith(strippedBase)) {
            locale = l;
            break;
          }
        }
      }
    }

    // get from browser settings
    if(locale === null) {
      const navL = navigator.language.slice(0, 2);
      for(const l of Object.values(SupportedLocales)) {
        if(l.slice(0, 2) === navL) {
          locale = l;
          break;
        }
      }
    }

    // if it still null use en-US as default
    if(locale === null) {
      locale = SupportedLocales.EN_US;
    }

    return locale;
  },
  deps: [PlatformLocation]
}


@NgModule({
  entryComponents: [
    GlyphTooltipComponent,
    OsmTooltipComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    GlyphTooltipComponent,
    CaseTooltipComponent,
    OverlayBrandComponent,
    OverlayMobileComponent,
    InfoboxComponent,
    HospitalInfoComponent,
    HospitalInfoDialogComponent,
    LegendComponent,
    PlusminusPipe,
    AboutComponent,
    ImpressumComponent,
    VegaComponent,
    HelpDialogComponent,
    TranslatePipe,
    OsmTooltipComponent,
    MapRootComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    OverlayModule,
    BrowserAnimationsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
    ScrollingModule,
    MatExpansionModule,
    MatTooltipModule,
    MatIconModule,
    MatRadioModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatSnackBarModule,
    MatStepperModule,
    AppRoutingModule
  ],
  providers: [
    localeProvider, 
    {
      provide: APP_BASE_HREF,
      useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
      deps: [PlatformLocation]
    },
    PlusminusPipe, 
    DecimalPipe, 
    TranslatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }

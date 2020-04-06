import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DecimalPipe, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_LOCALE } from 'src/constants';
import { AboutComponent } from './about/about.component';
import { AppComponent } from './app.component';
import { BedTooltipComponent } from './bed-tooltip/bed-tooltip.component';
import { CaseDialogComponent } from './case-dialog/case-dialog.component';
import { CaseInfoComponent } from './case-info/case-info.component';
import { CaseTooltipComponent } from './case-tooltip/case-tooltip.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { HelpDialogComponent } from './help-dialog/help-dialog.component';
import { HospitalInfoDialogComponent } from './hospital-info-dialog/hospital-info-dialog.component';
import { HospitalInfoComponent } from './hospital-info/hospital-info.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { InfoboxComponent } from './infobox/infobox.component';
import { LegendComponent } from './legend/legend.component';
import { MapComponent } from './map/map.component';
import { OsmTooltipComponent } from './osm-tooltip/osm-tooltip.component';
import { OverlayBrandComponent } from './overlay-brand/overlay-brand.component';
import { OverlayMobileComponent } from './overlay-mobile/overlay-mobile.component';
import { PlusminusPipe } from './plusminus.pipe';
import { SentryErrorHandler } from "./sentry-config";
import { SupportedLocales } from './services/i18n.service';
import { TranslatePipe } from './translate.pipe';
import { VegaComponent } from './vega/vega.component';





// the second parameter 'fr-FR' is optional



const storedLocale = JSON.parse(localStorage.getItem(APP_LOCALE)) as SupportedLocales;

export const localeProvider = {
  provide: LOCALE_ID,
  useFactory: () => {
    if(storedLocale === SupportedLocales.DE_DE) {
      return 'de-DE'
    } else {
      return 'en-US';
    }
  }
}


if(storedLocale === SupportedLocales.DE_DE) {
  registerLocaleData(localeDe, 'de-DE');
} else {
  registerLocaleData(localeEn, 'en-US');
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
    CaseInfoComponent,
    CaseDialogComponent,
    BedTooltipComponent
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
    MatToolbarModule,
    FlexLayoutModule,
    MatTabsModule
  ],
  providers: [localeProvider, PlusminusPipe, DecimalPipe, TranslatePipe, { provide: ErrorHandler, useClass: SentryErrorHandler }],
  bootstrap: [AppComponent]
})
export class AppModule { }

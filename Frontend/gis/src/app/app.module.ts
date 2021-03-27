import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { APP_BASE_HREF, CommonModule, PlatformLocation, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import { ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NouisliderModule } from 'ng2-nouislider';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BedTooltipComponent } from './bed-tooltip/bed-tooltip.component';
import { ButtonPanelComponent } from './button-panel/button-panel.component';
import { GdprComponent } from './gdpr/gdpr.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { HelpModule } from './help/help.module';
import { HospitalInfoDialogComponent } from './hospital-info-dialog/hospital-info-dialog.component';
import { HospitalInfoComponent } from './hospital-info/hospital-info.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { InfoboxComponent } from './infobox/infobox.component';
import { LegendComponent } from './legend/legend.component';
import { MapRootComponent } from './map-root/map-root.component';
import { MapComponent } from './map/map.component';
import { OsmTooltipComponent } from './osm-tooltip/osm-tooltip.component';
import { OverlayBrandComponent } from './overlay-brand/overlay-brand.component';
import { OverviewModule } from './overview/overview.module';
import { SentryErrorHandler } from './sentry-config';
import { SupportedLocales } from './services/i18n.service';
import { ShareDialogComponent } from './share-dialog/share-dialog.component';
import { SharedModule } from './shared/shared.module';
import { TimesliderComponent } from './timeslider/timeslider.component';
import localeEn from './util/locales/en';
import { CasesDodModule } from './cases-dod/cases-dod.module';
import { MarkdownModule } from 'ngx-markdown';








// the second parameter 'fr-FR' is optional
registerLocaleData(localeDe, 'de-DE');
registerLocaleData(localeEn, 'en-US');

const localeProvider = {
  provide: LOCALE_ID,
  useFactory: (s: PlatformLocation) => {

    let locale: SupportedLocales = null;

    // get from localStorage
    // if(storedLocale) {
    //   locale = storedLocale;
    // }

    // get form base url e.g. /en/ /de/
    if (locale === null) {
      const strippedBase = s.getBaseHrefFromDOM().replace(/\//g, '');
      if (strippedBase.length === 2) {
        for (const l of Object.values(SupportedLocales)) {
          if (l.startsWith(strippedBase)) {
            locale = l;
            break;
          }
        }
      }
    }

    // get from browser settings
    if (locale === null) {
      const navL = navigator.language.slice(0, 2);
      for (const l of Object.values(SupportedLocales)) {
        if (l.slice(0, 2) === navL) {
          locale = l;
          break;
        }
      }
    }

    // if it still null use en-US as default
    if (locale === null) {
      locale = SupportedLocales.EN_US;
    }

    return locale;
  },
  deps: [PlatformLocation]
};


@NgModule({
  entryComponents: [
    GlyphTooltipComponent,
    OsmTooltipComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    GlyphTooltipComponent,
    OverlayBrandComponent,
    InfoboxComponent,
    HospitalInfoComponent,
    HospitalInfoDialogComponent,
    LegendComponent,
    AboutComponent,
    ImpressumComponent,
    OsmTooltipComponent,
    MapRootComponent,
    ShareDialogComponent,
    ButtonPanelComponent,
    BedTooltipComponent,
    TimesliderComponent,
    GdprComponent,
  ],
  imports: [
    CommonModule,
    SharedModule.forRoot(),
    MarkdownModule.forRoot(),
    BrowserModule,
    HttpClientModule,
    FormsModule,
    OverlayModule,
    BrowserAnimationsModule,
    OverviewModule,
    AppRoutingModule,
    MatButtonToggleModule,
    MatCardModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
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
    MatSelectModule,
    MatStepperModule,
    MatInputModule,
    MatCheckboxModule,
    MatTabsModule,
    MatToolbarModule,
    FlexLayoutModule,
    NouisliderModule,
    MatSliderModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    HelpModule,
    MatCardModule,
    CasesDodModule
  ],
  providers: [
    localeProvider,
    {
      provide: APP_BASE_HREF,
      useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
      deps: [PlatformLocation]
    },
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { APP_BASE_HREF, CommonModule, PlatformLocation, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import { ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NouisliderModule } from 'ng2-nouislider';
import { MarkdownModule } from 'ngx-markdown';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BedTooltipComponent } from './bed-tooltip/bed-tooltip.component';
import { ButtonPanelComponent } from './button-panel/button-panel.component';
import { CasesDodModule } from './cases-dod/cases-dod.module';
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

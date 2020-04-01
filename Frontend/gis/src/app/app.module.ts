import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { GlyphTooltipComponent } from './glyph-tooltip/glyph-tooltip.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { CaseTooltipComponent } from './case-tooltip/case-tooltip.component';
import { OverlayBrandComponent } from './overlay-brand/overlay-brand.component';
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

import { registerLocaleData, DecimalPipe } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';
import { APP_LOCALE } from 'src/constants';
import { SupportedLocales } from './services/i18n.service';
import { TranslatePipe } from './translate.pipe';

// the second parameter 'fr-FR' is optional



const storedLocale = JSON.parse(localStorage.getItem(APP_LOCALE)) as SupportedLocales;

let localeProvider;
if(storedLocale === SupportedLocales.DE_DE) {
  localeProvider = {provide: LOCALE_ID, useValue: 'de-DE'};
  registerLocaleData(localeDe, 'de-DE');
} else {
  localeProvider = {provide: LOCALE_ID, useValue: 'en-US'};
  registerLocaleData(localeEn, 'en-US');
}


@NgModule({
  entryComponents: [
    GlyphTooltipComponent
  ],
  declarations: [
    AppComponent,
    MapComponent,
    GlyphTooltipComponent,
    CaseTooltipComponent,
    OverlayBrandComponent,
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
    MatStepperModule
  ],
  providers: [localeProvider, PlusminusPipe, DecimalPipe, TranslatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }

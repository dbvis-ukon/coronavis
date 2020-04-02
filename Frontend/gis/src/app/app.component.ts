import {Component, OnInit} from '@angular/core';
import {FeatureCollection} from 'geojson';
import {Overlay} from './map/overlays/overlay';
import {AggregationLevel} from './map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from './map/options/covid-number-case-options';
import {BedType} from './map/options/bed-type.enum';
import {CaseChoropleth} from './map/overlays/casechoropleth';
import {MapOptions} from './map/options/map-options';
import {environment} from 'src/environments/environment';
import {APP_CONFIG_KEY, APP_HELP_SEEN} from "../constants";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog/help-dialog.component";
import { I18nService } from './services/i18n.service';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  private defaultMapOptions = {
    bedGlyphOptions: {
      aggregationLevel: AggregationLevel.none,
      enabled: true,
      showEcmo: true,
      showIcuHigh: true,
      showIcuLow: true
    },

    bedBackgroundOptions: {
      bedType: BedType.icuLow,
      enabled: false,
      aggregationLevel: AggregationLevel.county
    },

    covidNumberCaseOptions: {
      change: CovidNumberCaseChange.absolute,
      normalization: CovidNumberCaseNormalization.absolut,
      timeWindow: CovidNumberCaseTimeWindow.all,
      type: CovidNumberCaseType.cases,
      enabled: false,
      aggregationLevel: AggregationLevel.county
    },

    showOsmHeliports: false,

    showOsmHospitals: false,

    forceDirectedOn: false
  };
  mapOptions: MapOptions = this.defaultMapOptions;

  currentCaseChoropleth: CaseChoropleth;

  siteId: number;

  // constructor is here only used to inject services
  constructor(private snackbar: MatSnackBar,
              private dialog: MatDialog,
              private i18nService: I18nService,
              private translationService: TranslationService
              ) {
  }

  ngOnInit(): void {
    this.i18nService.initI18n();


    const stored = JSON.parse(localStorage.getItem(APP_CONFIG_KEY)) as MapOptions;
    if (stored) {
      this.mapOptions = stored;
      let snackbar = this.snackbar.open(
        this.translationService.translate("Die Anwendungskonfiguration aus Ihrem letzten Besuch wurde wiederhergestellt"),
        this.translationService.translate("Zurücksetzen"), {
        politeness: "polite",
        duration: 20000
      });
      snackbar.onAction().subscribe(() => {
        this.mapOptions = this.defaultMapOptions;
        localStorage.removeItem(APP_CONFIG_KEY);
      })
    }

    const helpSeen = JSON.parse(localStorage.getItem(APP_HELP_SEEN)) || false;
    if (!helpSeen) {
      this.dialog.open(HelpDialogComponent)
        .afterClosed().subscribe(d => {
        localStorage.setItem(APP_HELP_SEEN, JSON.stringify(true));
      })
    }

    const trackingPixelSiteIDMapping = {
      'production': 1,
      'staging': 3,
      'review': 4,
      'development': 5
    };

    this.siteId = trackingPixelSiteIDMapping[environment.env];
  }
}

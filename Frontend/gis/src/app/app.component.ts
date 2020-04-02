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
import {APP_CONFIG_KEY, APP_HELP_SEEN, MAP_LOCATION_SETTINGS_KEY} from "../constants";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog/help-dialog.component";
import { I18nService } from './services/i18n.service';
import { TranslationService } from './services/translation.service';
import { MapLocationSettings } from './map/options/map-location-settings';
import { BehaviorSubject, of } from 'rxjs';
import { safeDebounce } from './util/safe-debounce';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  private defaultMapOptions: MapOptions = {
    bedGlyphOptions: {
      aggregationLevel: AggregationLevel.none,
      enabled: true,
      showEcmo: true,
      showIcuHigh: true,
      showIcuLow: true,
      forceDirectedOn: true
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

    showOsmHospitals: false
  };

  private defaultMapLocationSettings: MapLocationSettings = {

    center: {
      lat: 48.6813312,
      lng: 9.0088299
    },

    zoom: 9
  };


  mapOptions: MapOptions = JSON.parse(JSON.stringify(this.defaultMapOptions));

  mapLocationSettings$: BehaviorSubject<MapLocationSettings> = new BehaviorSubject(JSON.parse(JSON.stringify(this.defaultMapLocationSettings)));

  currentCaseChoropleth: CaseChoropleth;

  initialMapLocationSettings: MapLocationSettings = JSON.parse(JSON.stringify(this.defaultMapLocationSettings));

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


    this.restoreSettingsFromLocalStorageOrUseDefault();


    this.displayHelpForNewUser();


    this.initTrackingPixel();


    // listen for map changes and debounce
    // writing into local storage by 500ms
    // to save cpu/io
    this.mapLocationSettings$.asObservable()
    .pipe(
      safeDebounce(500, a => of(a))
    )
    .subscribe(newLocSettings => {
      // store data into local storage
      localStorage.setItem(MAP_LOCATION_SETTINGS_KEY, JSON.stringify(newLocSettings));
    });
  }

  mapLocationSettingsUpdated(newSettings: MapLocationSettings) {
    this.mapLocationSettings$.next(newSettings);
  }

  mapOptionsUpdated(newOptions: MapOptions) {
    this.mapOptions = newOptions;
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(newOptions));
  }

  initTrackingPixel() {
    const trackingPixelSiteIDMapping = {
      'production': 1,
      'staging': 3,
      'review': 4,
      'development': 5
    };

    this.siteId = trackingPixelSiteIDMapping[environment.env];
  }

  displayHelpForNewUser() {
    const helpSeen = JSON.parse(localStorage.getItem(APP_HELP_SEEN)) || false;
    if (!helpSeen) {
      this.dialog.open(HelpDialogComponent)
        .afterClosed().subscribe(d => {
        localStorage.setItem(APP_HELP_SEEN, JSON.stringify(true));
      });
    }
  }

  restoreSettingsFromLocalStorageOrUseDefault() {
    const storedMapOptions = JSON.parse(localStorage.getItem(APP_CONFIG_KEY)) as MapOptions;
    let restored = false;
    if (storedMapOptions) {
      this.mapOptions = storedMapOptions;
      restored = true;
    }

    const storedMapLocationSettings = JSON.parse(localStorage.getItem(MAP_LOCATION_SETTINGS_KEY)) as MapLocationSettings;
    if(storedMapLocationSettings) {
      // this.mapLocationSettings$.next(storedMapLocationSettings);
      this.initialMapLocationSettings = storedMapLocationSettings;
      restored = true;
    }

    if(restored) {
      let snackbar = this.snackbar.open(
        this.translationService.translate("Die Anwendungskonfiguration aus Ihrem letzten Besuch wurde wiederhergestellt"),
        this.translationService.translate("Zurücksetzen"), {
        politeness: "polite",
        duration: 20000
      });
      snackbar.onAction().subscribe(() => {
        this.mapOptions = this.defaultMapOptions;
        this.mapLocationSettings$.next(this.defaultMapLocationSettings);

        localStorage.removeItem(APP_CONFIG_KEY);
        localStorage.removeItem(MAP_LOCATION_SETTINGS_KEY);
      });
    }
  }
}

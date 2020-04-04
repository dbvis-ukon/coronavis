import {Component, OnInit} from '@angular/core';
import {FeatureCollection} from 'geojson';
import {Overlay} from '../map/overlays/overlay';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../map/options/covid-number-case-options';
import {BedType} from '../map/options/bed-type.enum';
import {CaseChoropleth} from '../map/overlays/casechoropleth';
import {MapOptions} from '../map/options/map-options';
import {environment} from 'src/environments/environment';
import {APP_CONFIG_KEY, APP_HELP_SEEN, MAP_LOCATION_SETTINGS_KEY, APP_CONFIG_URL_KEY, MAP_LOCATION_SETTINGS_URL_KEY} from "../../constants";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "../help-dialog/help-dialog.component";
import { I18nService } from '../services/i18n.service';
import { TranslationService } from '../services/translation.service';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { BehaviorSubject, of } from 'rxjs';
import { safeDebounce } from '../util/safe-debounce';
import { UrlHandlerService } from '../services/url-handler.service';
import { Router, ActivatedRoute } from '@angular/router';
import { merge, trimEnd } from 'lodash-es';

@Component({
  selector: 'app-map-root',
  templateUrl: './map-root.component.html',
  styleUrls: ['./map-root.component.less']
})
export class MapRootComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  private defaultMapOptions: MapOptions = {
    hideInfobox: false,

    extendInfobox: true,

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

    zoom: 9,

    allowPanning: true,

    allowZooming: true
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
              private translationService: TranslationService,
              private urlHandlerService: UrlHandlerService,
              private router: Router,
              private route: ActivatedRoute
              ) {
  }

  ngOnInit(): void {
    //TESTING

    // this.router.navigate(['/map', {mlo: this.urlHandlerService.convertMLOToUrl(this.defaultMapOptions)}]);

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

    console.log(this.urlHandlerService.convertMLOToUrl(this.mapOptions));

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
    // try from url params
    const paramMap = this.route.snapshot.paramMap;

    const storedMapOptions = JSON.parse(localStorage.getItem(APP_CONFIG_KEY)) as MapOptions;

    // will show the snack bar if true
    let restored = false;

    if(paramMap.has(APP_CONFIG_URL_KEY)) {
      const urlMlo = this.urlHandlerService.convertUrlToMLO(paramMap.get(APP_CONFIG_URL_KEY));

      const mergedMlo = merge<MapOptions, MapOptions>(this.defaultMapOptions, urlMlo);

      this.mapOptions = mergedMlo;
    } else if (storedMapOptions) {
      // merge with default as basis is necessary when new options are added in further releases
      this.mapOptions = merge<MapOptions, MapOptions, any>(this.defaultMapOptions, storedMapOptions, { hideInfobox: false });
      restored = true;
    }


    const storedMapLocationSettings = JSON.parse(localStorage.getItem(MAP_LOCATION_SETTINGS_KEY)) as MapLocationSettings;

    if(paramMap.has(MAP_LOCATION_SETTINGS_URL_KEY)) {
      const urlMls = this.urlHandlerService.convertUrlToMLS(paramMap.get(MAP_LOCATION_SETTINGS_URL_KEY));

      const mergedMls = merge<MapLocationSettings, MapLocationSettings>(this.defaultMapLocationSettings, urlMls);

      this.initialMapLocationSettings = mergedMls;
    } else if(storedMapLocationSettings) {
      // this.mapLocationSettings$.next(storedMapLocationSettings);
      this.initialMapLocationSettings = merge<MapLocationSettings, MapLocationSettings, any>(
        this.defaultMapLocationSettings, 
        storedMapLocationSettings, 
        { // overwrite this otherwise the app is broken when it's loaded from local storage
          allowPanning: true,
          allowZooming: true
        }
      );
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

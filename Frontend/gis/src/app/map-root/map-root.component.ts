import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { FeatureCollection } from 'geojson';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { APP_CONFIG_KEY, APP_CONFIG_URL_KEY, APP_HELP_SEEN, MAP_LOCATION_SETTINGS_KEY, MAP_LOCATION_SETTINGS_URL_KEY } from '../../constants';
import { HelpDialogComponent } from '../help/help-dialog/help-dialog.component';
import { FlyTo } from '../map/events/fly-to';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { Overlay } from '../map/overlays/overlay';
import { ConfigService } from '../services/config.service';
import { I18nService } from '../services/i18n.service';
import { MyLocalStorageService } from '../services/my-local-storage.service';
import { TranslationService } from '../services/translation.service';
import { UrlHandlerService } from '../services/url-handler.service';
import { EbrakeSnackbarComponent } from '../shared/ebrake-snackbar/ebrake-snackbar.component';
import { safeDebounce } from '../util/safe-debounce';

@Component({
  selector: 'app-map-root',
  templateUrl: './map-root.component.html',
  styleUrls: ['./map-root.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapRootComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();






  mapOptions: MapOptions = null;

  mapOptions$: Subject<MapOptions> = new BehaviorSubject(null);

  mapLocationSettings$: BehaviorSubject<MapLocationSettings> = new BehaviorSubject(null);

  currentCaseChoropleth$: Subject<CaseChoropleth> = new BehaviorSubject(null);

  initialMapLocationSettings: MapLocationSettings = null;

  currentMapLocationSettings: MapLocationSettings = null;

  siteId: number;

  flyTo: FlyTo = null;

  // constructor is here only used to inject services
  constructor(
    private configService: ConfigService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private i18nService: I18nService,
    private translationService: TranslationService,
    private urlHandlerService: UrlHandlerService,
    private route: ActivatedRoute,
    private storage: MyLocalStorageService,
              ) {
  }

  ngOnInit(): void {
    this.i18nService.initI18n();


    this.restoreSettingsFromLocalStorageOrUseDefault();

    this.route.paramMap.pipe(switchMap(d => {
      this.restoreSettingsFromLocalStorageOrUseDefault(d);

      return of(d);
    }))
    .subscribe();


    this.displayHelpForNewUser();


    this.initTrackingPixel();


    // listen for map changes and debounce
    // writing into local storage by 500ms
    // to save cpu/io
    this.mapLocationSettings$.asObservable()
    .pipe(
      safeDebounce(500, (a: MapLocationSettings) => of(a))
    )
    .subscribe(newLocSettings => {
      this.currentMapLocationSettings = newLocSettings as MapLocationSettings;

      // store data into local storage
      this.storage.store(MAP_LOCATION_SETTINGS_KEY, JSON.stringify(newLocSettings));
    });


    this.mapOptions$
    .pipe(
      safeDebounce(500, (a: MapOptions) => of(a))
    )
    .subscribe(mo => {
      this.storage.store(APP_CONFIG_KEY, JSON.stringify(mo));
    });
  }

  mapLocationSettingsUpdated(newSettings: MapLocationSettings) {
    this.mapLocationSettings$.next(newSettings);
  }

  mapOptionsUpdated(newOptions: MapOptions, keepInteractions = false) {
    if (!keepInteractions) {
      newOptions.covidNumberCaseOptions._binHovered = null;
      newOptions.covidNumberCaseOptions._binSelection = null;
    }

    this.mapOptions = newOptions;

    this.mapOptions$.next(newOptions);
  }

  initTrackingPixel() {
    const trackingPixelSiteIDMapping = {
      production: 1,
      staging: 3,
      review: 4,
      development: 5
    };

    this.siteId = trackingPixelSiteIDMapping[environment.env];
  }

  displayHelpForNewUser() {
    const helpSeen = JSON.parse(this.storage.retrieve(APP_HELP_SEEN)) || false;
    if (this.mapOptions?.showHelpOnStart && !helpSeen) {
      this.dialog.open(HelpDialogComponent)
        .afterClosed().subscribe(d => {
        this.storage.store(APP_HELP_SEEN, JSON.stringify(true));
      });
    }
  }

  restoreSettingsFromLocalStorageOrUseDefault(paramMap = null) {
    if (!paramMap) {
      // try from url params
      paramMap = this.route.snapshot.paramMap;
    }

    const storedMapOptions = JSON.parse(this.storage.retrieve(APP_CONFIG_KEY)) as MapOptions;

    // will show the snack bar if true
    let restored = false;

    const urlSegments = this.route.snapshot.url;
    if ((urlSegments && urlSegments[0] && urlSegments[0].path === 'lockdown') || paramMap && paramMap.get('flavor') === 'lockdown') {

      const lockdownMlo = this.configService.getLockDownMapOptions(false);

      this.mapOptions = lockdownMlo;

      this.mapOptions$.next(lockdownMlo);
    } else if ((urlSegments && urlSegments[0] && urlSegments[0].path === 'lockdown-live') || paramMap && paramMap.get('flavor') === 'lockdown-live') {

      const lockdownMlo = this.configService.getLockDownMapOptions(true);

      this.mapOptions = lockdownMlo;

      this.mapOptions$.next(lockdownMlo);
    } else if ((urlSegments && urlSegments[0] && urlSegments[0].path === 'ebrake') || paramMap && paramMap.get('flavor') === 'ebrake') {

      const lockdownMlo = this.configService.getLockDownMapOptions(false);
      lockdownMlo.covidNumberCaseOptions.eBrakeOver = 100;

      this.mapOptions = lockdownMlo;

      this.mapOptions$.next(lockdownMlo);

      this.snackbar.openFromComponent(EbrakeSnackbarComponent, {
        politeness: 'polite',
        duration: 10000,
        verticalPosition: 'top'
      });
    } else if ((urlSegments && urlSegments[0] && urlSegments[0].path === 'bedcapacities') || paramMap && paramMap.get('flavor') === 'bedcapacities') {
      const capacityMlo = this.configService.getICUMapOptions();

      this.mapOptions = capacityMlo;

      this.mapOptions$.next(capacityMlo);
    } else if (paramMap.has(APP_CONFIG_URL_KEY)) {
      this.urlHandlerService.convertUrlToMLO(paramMap.get(APP_CONFIG_URL_KEY)).then(urlMlo => {
        const mergedMlo = this.configService.overrideMapOptions(urlMlo);

        this.mapOptions = mergedMlo;

        this.mapOptions$.next(this.mapOptions);
      });
    } else if (storedMapOptions) {
      // merge with default as basis is necessary when new options are added in further releases
      this.mapOptions = this.configService.overrideMapOptions(
        storedMapOptions,
        { hideInfobox: false, showHelpOnStart: true, bedGlyphOptions: {date: 'now'}, bedBackgroundOptions: {date: 'now'}, covidNumberCaseOptions: {date: 'now'} }
      );
      restored = true;

      this.mapOptions$.next(this.mapOptions);
    } else {
      this.mapOptions = this.configService.getDefaultMapOptions();

      this.mapOptions$.next(this.mapOptions);
    }


    const storedMapLocationSettings = JSON.parse(this.storage.retrieve(MAP_LOCATION_SETTINGS_KEY)) as MapLocationSettings;

    if (paramMap.has(MAP_LOCATION_SETTINGS_URL_KEY)) {
      this.urlHandlerService.convertUrlToMLS(paramMap.get(MAP_LOCATION_SETTINGS_URL_KEY)).then(urlMls => {
        const mergedMls = this.configService.overrideMapLocationSettings(urlMls);

        this.initialMapLocationSettings = mergedMls;
      });
    } else if (storedMapLocationSettings) {
      // this.mapLocationSettings$.next(storedMapLocationSettings);
      this.initialMapLocationSettings = this.configService.overrideMapLocationSettings(storedMapLocationSettings, {
        allowPanning: true,
        allowZooming: true
      });
    } else { // use default
      this.initialMapLocationSettings = this.configService.getDefaultMapLocationSettings();
    }

    if (restored) {
      const snackbar = this.snackbar.open(
        this.translationService.translate('Die Anwendungskonfiguration aus Ihrem letzten Besuch wurde wiederhergestellt'),
        this.translationService.translate('Zurücksetzen'),
        {
        politeness: 'polite',
        duration: 5000,
        verticalPosition: 'top'
      });
      snackbar.onAction().subscribe(() => {
        this.mapOptions = this.configService.getDefaultMapOptions();
        this.mapLocationSettings$.next(this.configService.getDefaultMapLocationSettings());

        this.storage.clear(APP_CONFIG_KEY);
        this.storage.clear(MAP_LOCATION_SETTINGS_KEY);
      });
    }
  }
}

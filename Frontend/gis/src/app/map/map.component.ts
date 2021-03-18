import { APP_BASE_HREF } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import { SVGOverlay } from 'leaflet';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { OSMLayerService } from '../services/osm-layer.service';
import { TooltipService } from '../services/tooltip.service';
import { TranslationService } from '../services/translation.service';
import { FlyTo } from './events/fly-to';
import { AggregationLevel } from './options/aggregation-level.enum';
import { BedBackgroundOptions } from './options/bed-background-options';
import { BedGlyphOptions } from './options/bed-glyph-options';
import { CovidNumberCaseOptions } from './options/covid-number-case-options';
import { MapLocationSettings } from './options/map-location-settings';
import { MapOptions } from './options/map-options';
import { CaseChoropleth } from './overlays/casechoropleth';
import { GlyphLayer } from './overlays/GlyphLayer';


export enum MapOptionKeys {
  bedGlyphOptions, bedBackgroundOptions, covidNumberCaseOptions, showOsmHospitals, showOsmHeliports
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less'],
  // super important, otherwise the defined css doesn't get added to dynamically created elements, for example, from D3.
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit {

  @ViewChild('main') main;

  private bedGlyphOptions$: BehaviorSubject<BedGlyphOptions> = new BehaviorSubject(null);

  private bedBackgroundOptions$: BehaviorSubject<BedBackgroundOptions> = new BehaviorSubject(null);

  private caseChoroplethOptions$: BehaviorSubject<CovidNumberCaseOptions> = new BehaviorSubject(null);

  private _mapOptions: MapOptions;

  @Input()
  set mapOptions(mo: MapOptions) {
    this._mapOptions = mo;

    this.updateMap(mo);
  }

  get mapOptions(): MapOptions {
    return this._mapOptions;
  }

  private _mapLocationSettings: MapLocationSettings;

  @Input()
  set mapLocationSettings(mls: MapLocationSettings) {
    this._mapLocationSettings = mls;

    this.updateMapLocation(mls);
  }

  get mapLocationSettings(): MapLocationSettings {
    return this._mapLocationSettings;
  }

  @Output()
  mapLocationSettingsChange: EventEmitter<MapLocationSettings> = new EventEmitter();

  @Output()
  caseChoroplethLayerChange: EventEmitter<CaseChoropleth> = new EventEmitter();

  private _flyTo: FlyTo;

  @Input()
  set flyTo(t: FlyTo) {
    this._flyTo = t;

    if (this.mymap && t) {
      this.mymap.flyTo(t.loc, t.zoom);
    }
  }

  get flyTo(): FlyTo {
    return this._flyTo;
  }

  // private layerControl: L.Control.Layers;

  private mymap: L.Map;

  private layerToFactoryMap = new Map<L.SVGOverlay | L.LayerGroup<any>, GlyphLayer[]>();

  private aggregationLevelToGlyphMap = new Map<string, L.LayerGroup<any>>();

  private osmHospitalsLayer: L.GeoJSON<any>;

  private osmHeliportsLayer: L.GeoJSON<any>;

  private covidNumberCaseOptionsKeyToLayer = new Map<string, L.LayerGroup>();

  private _lastBedCoroplethLayer: L.LayerGroup | null;

  private previousOptions = new Map();

  private glyphLayerSubscription: Subscription;
  private bedChoroplethSubscription: Subscription;
  private caseChoroplethSubscription: Subscription;
  private osmHospitalLayerSubscription: Subscription;
  private osmHelipadLayerSubscription: Subscription;

  private zoomControl: L.Control.Zoom;

  constructor(
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private glyphLayerService: GlyphLayerService,
    private caseChoroplehtLayerService: CaseChoroplethLayerService,
    private osmLayerService: OSMLayerService,
    private translationService: TranslationService,
    @Inject(APP_BASE_HREF) private baseHref: string,
    private tooltipService: TooltipService
  ) {
  }

  ngOnInit() {
    this.zoomControl = new L.Control.Zoom({position: 'topright'});

    const tiledMap = L.tileLayer(
        `${environment.tileServerUrl}{z}/{x}/{y}.png`,
        {
          tileSize: 256,
          // zoomOffset: -1,
          attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> ' +
                       '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a> | ' +
                       `<a href="${this.baseHref}overview/imprint">${ this.translationService.translate('Impressum') }</a> | ` +
                       `<a href="${this.baseHref}overview/gdpr">${ this.translationService.translate('Datenschutzerklärung') }</a>`
        });

    // create map, set initial view to to see whole of Germany (country wide deployment)
    const defaultView: L.LatLngExpression = [51.163375, 10.447683];
    const defaultZoom = 6;

    let mapLocationSettings = JSON.parse(JSON.stringify(this._mapLocationSettings));

    if (!mapLocationSettings) {

      mapLocationSettings = {
        center: defaultView,
        zoom: defaultZoom,
        allowPanning: true,
        allowZooming: true
      };

    }

    this.mymap = L.map('main', {
      preferCanvas: true,
      minZoom: 4,
      maxZoom: 13,
      layers: [tiledMap],
      zoomControl: false
    }).setView(mapLocationSettings.center, mapLocationSettings.zoom);

    this.mymap.on('moveend', () => {
      this.emitMapLocationSettings();
    });

    this.mymap.on('movestart', () => this.tooltipService.close());
    this.mymap.on('zoomstart', () => this.tooltipService.close());
    this.mymap.on('dragstart', () => this.tooltipService.close());

    this.mymap.on('zoom', () => {
      this.emitMapLocationSettings();

      // diable double click on highest zoom level
      if (this.mymap.getZoom() >= this.mymap.getMaxZoom()) {
        this.mymap.doubleClickZoom.disable();
      } else if (this._mapLocationSettings.allowZooming) {
        this.mymap.doubleClickZoom.enable();
      }
    });


    this.onChangeCaseChoropletOptions();

    this.updateMapLocation(mapLocationSettings);


    this.updateMap(this._mapOptions);
  }

  private emitMapLocationSettings() {
    const opt: MapLocationSettings = {
      center: this.mymap.getBounds().getCenter(),
      zoom: this.mymap.getZoom(),
      allowPanning: true,
      allowZooming: true
    };

    this.mapLocationSettingsChange.emit(opt);
  }

  private updateMapLocation(mapLoc: MapLocationSettings) {
    if (!this.mymap || !mapLoc) {
      return;
    }

    this.mymap.setView(mapLoc.center, mapLoc.zoom);

    if (mapLoc.allowZooming) {
      this.mymap.addControl(this.zoomControl);
    } else {
      this.mymap.removeControl(this.zoomControl);
    }

    if (mapLoc.allowPanning === false) {
      this.mymap.dragging.disable();
    } else {
      this.mymap.dragging.enable();
    }

    if (mapLoc.allowZooming === false) {
      this.mymap.touchZoom.disable();
      this.mymap.doubleClickZoom.disable();
      this.mymap.scrollWheelZoom.disable();
    } else {
      this.mymap.touchZoom.enable();
      this.mymap.doubleClickZoom.enable();
      this.mymap.scrollWheelZoom.enable();
    }
  }

  private updateMap(mo: MapOptions) {
    if (!this.mymap || !mo) {
      return;
    }

    if (this.glyphLayerSubscription) {
      this.glyphLayerSubscription.unsubscribe();
      this.glyphLayerService.loading$.next(false);
    }
    if (this.bedChoroplethSubscription) {
      this.bedChoroplethSubscription.unsubscribe();
      this.bedChoroplethLayerService.loading$.next(false);
    }
    if (this.caseChoroplethSubscription) {
      this.caseChoroplethSubscription.unsubscribe();
      this.caseChoroplehtLayerService.loading$.next(false);
    }
    if (this.osmHospitalLayerSubscription) {
      this.osmHospitalLayerSubscription.unsubscribe();
      this.osmLayerService.loading$.next(false);
    }
    if (this.osmHelipadLayerSubscription) {
      this.osmHelipadLayerSubscription.unsubscribe();
      this.osmLayerService.loading$.next(false);
    }

    const bedGlyphOptions = JSON.stringify(mo.bedGlyphOptions);
    if (this.previousOptions.get(MapOptionKeys.bedGlyphOptions) !== bedGlyphOptions) {
      this.updateGlyphMapLayers(mo.bedGlyphOptions);
      this.bedGlyphOptions$.next(mo.bedGlyphOptions);
    }
    this.previousOptions.set(MapOptionKeys.bedGlyphOptions, bedGlyphOptions);

    const bedBackgroundOptions = JSON.stringify(mo.bedBackgroundOptions);
    if (this.previousOptions.get(MapOptionKeys.bedBackgroundOptions) !== bedBackgroundOptions) {
      this.bedBackgroundOptions$.next(mo.bedBackgroundOptions);
      this.updateBedBackgroundLayer(mo.bedBackgroundOptions);
    }
    this.previousOptions.set(MapOptionKeys.bedBackgroundOptions, bedBackgroundOptions);

    const covidNumberCaseOptions = JSON.stringify(mo.covidNumberCaseOptions);
    if (this.previousOptions.get(MapOptionKeys.covidNumberCaseOptions) !== covidNumberCaseOptions) {
      this.caseChoroplethOptions$.next(mo.covidNumberCaseOptions);
    }
    this.previousOptions.set(MapOptionKeys.covidNumberCaseOptions, covidNumberCaseOptions);


    if (mo.showOsmHospitals && !this.osmHospitalsLayer) {
      this.osmHospitalLayerSubscription = this.osmLayerService.getOSMHospitalLayer()
      .pipe(
        switchMap(l => of(l))
      )
      .subscribe(l => {
        this.osmHospitalsLayer = l.createOverlay();
        this.mymap.addLayer(this.osmHospitalsLayer);
      });
    } else if (!mo.showOsmHospitals && this.osmHospitalsLayer) {
      this.mymap.removeLayer(this.osmHospitalsLayer);
      this.osmHospitalsLayer = null;
    }

    if (mo.showOsmHeliports && !this.osmHeliportsLayer) {
      this.osmHelipadLayerSubscription = this.osmLayerService.getOSMHeliportLayer()
      .pipe(
        switchMap(l => of(l))
      )
      .subscribe(l => {
        this.osmHeliportsLayer = l.createOverlay();
        this.mymap.addLayer(this.osmHeliportsLayer);
      });
    } else if (!mo.showOsmHeliports && this.osmHeliportsLayer) {
      this.mymap.removeLayer(this.osmHeliportsLayer);
      this.osmHeliportsLayer = null;
    }
  }

  private removeGlyphMapLayers() {
    // remove all layers
    this.aggregationLevelToGlyphMap.forEach(l => {
      this.mymap.removeLayer(l);

      this.layerToFactoryMap.get(l).forEach(f => (f as unknown as GlyphLayer).setVisibility(false));
    });
  }

  private updateGlyphMapLayers(o: BedGlyphOptions) {
    if (o.enabled === false) {
      this.removeGlyphMapLayers();
      return;
    }

    this.removeGlyphMapLayers();

    let obs: Observable<L.LayerGroup>;
    if (o.aggregationLevel === AggregationLevel.none) {
        obs = this.glyphLayerService.getSimpleGlyphLayer(o, this.bedGlyphOptions$)
        .pipe(
          map(glyphFactories => {

            const layerGroup = L.layerGroup([]);

            for (const glyphLayer of glyphFactories) {

              layerGroup.addLayer(glyphLayer);
            }

            this.layerToFactoryMap.set(layerGroup, glyphFactories);

            return layerGroup;
          }));
      } else {
        obs = this.glyphLayerService.getAggregatedGlyphLayer(o, this.bedGlyphOptions$)
        .pipe(
          map(([glyphLayer, backgroundFactory]) => {

          const bgLayer = backgroundFactory.createOverlay();

          // Create a layer group
          const layerGroup = L.layerGroup([bgLayer, glyphLayer]);

          this.layerToFactoryMap.set(layerGroup, [glyphLayer]);

          return layerGroup;
        }));
      }

    this.glyphLayerSubscription = obs
      .pipe(
        switchMap(l => of(l))
      )
      .subscribe(layerGroup => {
        this.aggregationLevelToGlyphMap.set(`${o.aggregationLevel}-${o.forceDirectedOn}`, layerGroup);

        this.showGlyphLayer(layerGroup);
      });
  }

  private showGlyphLayer(l: L.LayerGroup) {
    // if the layer is already there we don't need to remove it and add it again
    // this is the case when only the date changes with the time slider
    if (this.mymap.hasLayer(l)) {
      return;
    }

    this.removeGlyphMapLayers();

    this.mymap.addLayer(l);

    this.layerToFactoryMap.get(l).forEach(f => (f as unknown as GlyphLayer).setVisibility(true));

    this.bringGlyphLayersToFront(l);
  }

  private bringGlyphLayersToFront(l: L.LayerGroup) {
    if (l.getLayers().length === 2) {

      // aggregation glyph layer groups
      (l.getLayers()[1] as SVGOverlay).bringToFront();


    } else {

      // simple glyph layers with four quadrants
      for (const svgLayer of l.getLayers()) {
        (svgLayer as SVGOverlay).bringToFront();
      }
    }
  }

  private removeCaseChoroplethLayers() {
    // remove all layers
    this.covidNumberCaseOptionsKeyToLayer.forEach(l => {
      this.mymap.removeLayer(l);
    });
  }

  private onChangeCaseChoropletOptions() {
    this.caseChoroplethOptions$
    .pipe(
      filter(opt => {
        if (!opt || !opt.enabled) {
          this.caseChoroplethLayerChange.emit(null);
          this.removeCaseChoroplethLayers();
          return false;
        }

        return true;
      }),
      switchMap(opt => {
        const c = this.caseChoroplehtLayerService.getLayer(this.caseChoroplethOptions$)
        .pipe(
          map(d => ({
              opt,
              data: d
            }))
        );
        return c;
      })
    ).subscribe(d => {
      const opt = d.opt;
      const factory = d.data[0];
      const labels = d.data[1];

      const background = factory.createOverlay();

      const l = L.layerGroup([background, labels]);

      this.removeCaseChoroplethLayers();

      const key = this.caseChoroplehtLayerService.getKeyCovidNumberCaseOptions(opt);

      this.covidNumberCaseOptionsKeyToLayer.set(key, l);

      this.layerToFactoryMap.set(l, [labels]);

      this.mymap.addLayer(l);

      this.caseChoroplethLayerChange.emit(factory as CaseChoropleth);

      background.bringToBack();

      for (const glyphLayer of this.aggregationLevelToGlyphMap.values()) {
        this.bringGlyphLayersToFront(glyphLayer);
      }
    });
  }

  private removeBedChoroplethLayers() {
    // remove active layer
    if (this._lastBedCoroplethLayer) {
      this.mymap.removeLayer(this._lastBedCoroplethLayer);
    }
  }

  private updateBedBackgroundLayer(o: BedBackgroundOptions) {
    if (o.enabled === false) {
      this.removeBedChoroplethLayers();
      return;
    }

    if (o.aggregationLevel === AggregationLevel.none) {
      this.removeBedChoroplethLayers();
      throw new Error('AggregationLevel must not be none on bed background layer');
    }

    if (o.enabled) {

      this.bedChoroplethSubscription = this.bedChoroplethLayerService.getQualitativeLayer(this.bedBackgroundOptions$)
      .pipe(
        switchMap(f => of(f))
      )
      .subscribe(([factory, labels]) => {


        const background = factory.createOverlay();
        const layer = L.layerGroup([background, labels]);

        this.removeBedChoroplethLayers();

        this.mymap.addLayer(layer);

        this._lastBedCoroplethLayer = layer;

        background.bringToBack();
      });

    }
  }
}

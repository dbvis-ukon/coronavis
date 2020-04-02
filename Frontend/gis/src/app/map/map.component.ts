import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';

import * as L from 'leaflet';
import {GeoJSON, LatLng, LatLngTuple, SVGOverlay} from 'leaflet';
import 'mapbox-gl';
import 'mapbox-gl-leaflet';
// import 'leaflet-mapbox-gl';
import {Overlay} from './overlays/overlay';
import {FeatureCollection} from 'geojson';
import {Subject, Observable, Subscription} from 'rxjs';
import {AggregationLevel} from './options/aggregation-level.enum';
import {CovidNumberCaseOptions} from './options/covid-number-case-options';
import {MapOptions} from './options/map-options';
import {BedBackgroundOptions} from './options/bed-background-options';
import {BedGlyphOptions} from './options/bed-glyph-options';
import {environment} from 'src/environments/environment';
import { GlyphLayer } from './overlays/GlyphLayer';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import { OSMLayerService } from '../services/osm-layer.service';
import { CaseChoropleth } from './overlays/casechoropleth';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { map } from 'rxjs/operators';
import { MAP_VIEW_KEY, MAP_ZOOM_KEY} from "../../constants";
import {MatSnackBar} from "@angular/material/snack-bar";
import { TranslationService } from '../services/translation.service';
import { MapLocationSettings } from './options/map-location-settings';

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

  private bedGlyphOptions$: Subject<BedGlyphOptions> = new Subject();

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

  // private layerControl: L.Control.Layers;

  private mymap: L.Map;

  private choropletDataMap = new Map<AggregationLevel, FeatureCollection>();

  private layerToFactoryMap = new Map<L.SVGOverlay | L.LayerGroup<any>, Overlay<FeatureCollection>>();

  private aggregationLevelToGlyphMap = new Map<string, L.LayerGroup<any>>();

  private osmHospitalsLayer: L.GeoJSON<any>;

  private osmHeliportsLayer: L.GeoJSON<any>;

  private covidNumberCaseOptionsKeyToLayer = new Map<String, L.GeoJSON<any>>();

  private _lastBedCoroplethLayer: L.GeoJSON<any> | null;

  private previousOptions = new Map();

  private glyphLayerSubscription: Subscription;
  private bedChoroplethSubscription: Subscription;
  private caseChoroplethSubscription: Subscription;
  private osmHospitalLayerSubscription: Subscription;
  private osmHelipadLayerSubscription: Subscription;

  constructor(
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private glyphLayerService: GlyphLayerService,
    private caseChoroplehtLayerService: CaseChoroplethLayerService,
    private osmLayerService: OSMLayerService,
    private snackbar: MatSnackBar,
    private translationService: TranslationService
  ) {
  }

  ngOnInit() {
    const tiledMap = L.tileLayer(
        `${environment.tileServerUrl}{z}/{x}/{y}.png`,
        {
          tileSize: 256,
          // zoomOffset: -1,
          attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> ' +
                       '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>'
        });

    // create map, set initial view to to see whole of Germany (country wide deployment)
    const defaultView: LatLngTuple = [51.163375, 10.447683];
    const defaultZoom = 6;

    let initialView = JSON.parse(localStorage.getItem(MAP_VIEW_KEY))
    let initialZoom = +localStorage.getItem(MAP_ZOOM_KEY);

    if (initialView && initialZoom) {
      let snackbar = this.snackbar.open(
        this.translationService.translate("Der Kartenausschnitt aus Ihrem letzten Besuch wurde wiederhergestellt"),
        this.translationService.translate("Zurücksetzen"), {
        politeness: "polite",
        duration: 40000
      });
      snackbar.onAction().subscribe(() => {
        localStorage.removeItem(MAP_ZOOM_KEY);
        localStorage.removeItem(MAP_VIEW_KEY);
      })
    } else {
      initialView = defaultView;
      initialZoom = defaultZoom;
    }

    this.mymap = L.map('main', {
      minZoom: 6,
      maxZoom: 14,
      layers: [tiledMap],
      zoomControl: false
    }).setView(initialView, initialZoom);

    this.mymap.on('moveend', () => {
      localStorage.setItem(MAP_VIEW_KEY, JSON.stringify(this.mymap.getBounds().getCenter()));
      localStorage.setItem(MAP_ZOOM_KEY, "" + this.mymap.getZoom());
    });

    new L.Control.Zoom({position: 'topright'}).addTo(this.mymap);

    this.updateMap(this._mapOptions);
  }

  private updateMapLocation(mapLoc: MapLocationSettings) {
    if (!this.mymap) {
      return;
    }

    this.mymap.setView(mapLoc.center, mapLoc.zoom);
  }

  private updateMap(mo: MapOptions) {
    if (!this.mymap) {
      return;
    }

    if(this.glyphLayerSubscription) {
      this.glyphLayerSubscription.unsubscribe();
      this.glyphLayerService.loading$.next(false);
    }
    if(this.bedChoroplethSubscription) {
      this.bedChoroplethSubscription.unsubscribe();
      this.bedChoroplethLayerService.loading$.next(false);
    }
    if(this.caseChoroplethSubscription) {
      this.caseChoroplethSubscription.unsubscribe();
      this.caseChoroplehtLayerService.loading$.next(false);
    }
    if(this.osmHospitalLayerSubscription) {
      this.osmHospitalLayerSubscription.unsubscribe();
      this.osmLayerService.loading$.next(false);
    }
    if(this.osmHelipadLayerSubscription) {
      this.osmHelipadLayerSubscription.unsubscribe();
      this.osmLayerService.loading$.next(false);
    }

    const bedGlyphOptions = JSON.stringify(mo.bedGlyphOptions);
    if (this.previousOptions.get(MapOptionKeys.bedGlyphOptions) ?? "" !== bedGlyphOptions) {
      this.updateGlyphMapLayers(mo.bedGlyphOptions);
      this.bedGlyphOptions$.next(mo.bedGlyphOptions);
    }
    this.previousOptions.set(MapOptionKeys.bedGlyphOptions, bedGlyphOptions);

    const bedBackgroundOptions = JSON.stringify(mo.bedBackgroundOptions);
    if (this.previousOptions.get(MapOptionKeys.bedBackgroundOptions) ?? "" !== bedBackgroundOptions) {
      this.updateBedBackgroundLayer(mo.bedBackgroundOptions);
    }
    this.previousOptions.set(MapOptionKeys.bedBackgroundOptions, bedBackgroundOptions);

    const covidNumberCaseOptions = JSON.stringify(mo.covidNumberCaseOptions);
    if (this.previousOptions.get(MapOptionKeys.covidNumberCaseOptions) ?? "" !== covidNumberCaseOptions) {
      this.updateCaseChoroplethLayers(mo.covidNumberCaseOptions);
    }
    this.previousOptions.set(MapOptionKeys.covidNumberCaseOptions, covidNumberCaseOptions);


    if (mo.showOsmHospitals && !this.osmHospitalsLayer) {
      this.osmHospitalLayerSubscription = this.osmLayerService.getOSMHospitalLayer()
      .subscribe(l => {
        this.osmHospitalsLayer = l.createOverlay();
        this.mymap.addLayer(this.osmHospitalsLayer);
      })
    } else if (!mo.showOsmHospitals && this.osmHospitalsLayer) {
      this.mymap.removeLayer(this.osmHospitalsLayer);
      this.osmHospitalsLayer = null;
    }

    if (mo.showOsmHeliports && !this.osmHeliportsLayer) {
      this.osmHelipadLayerSubscription = this.osmLayerService.getOSMHeliportLayer()
      .subscribe(l => {
        this.osmHeliportsLayer = l.createOverlay();
        this.mymap.addLayer(this.osmHeliportsLayer);
      })
    } else if (!mo.showOsmHeliports && this.osmHeliportsLayer) {
      this.mymap.removeLayer(this.osmHeliportsLayer);
      this.osmHeliportsLayer = null;
    }
  }

  private removeGlyphMapLayers() {
    // remove all layers
    this.aggregationLevelToGlyphMap.forEach(l => {
      this.mymap.removeLayer(l);

      (this.layerToFactoryMap.get(l) as unknown as GlyphLayer).setVisibility(false);

    });
  }

  private updateGlyphMapLayers(o: BedGlyphOptions) {
    if(o.enabled === false) {
      this.removeGlyphMapLayers();
      return;
    }

    // internal caching for the glyph positions due to slow force layout:
    if(this.aggregationLevelToGlyphMap.has(`${o.aggregationLevel}-${o.forceDirectedOn}`)) {

      this.showGlyphLayer(this.aggregationLevelToGlyphMap.get(`${o.aggregationLevel}-${o.forceDirectedOn}`));

    } else {
      // dynamically create the map and load data from api

      let obs: Observable<L.LayerGroup>;
      if(o.aggregationLevel === AggregationLevel.none) {
        obs = this.glyphLayerService.getSimpleGlyphLayer(this.bedGlyphOptions$, o.forceDirectedOn)
        .pipe(
          map(glyphFactory => {
            const glyphLayer = glyphFactory.createOverlay(this.mymap);

            const layerGroup = L.layerGroup([glyphLayer]);

            this.layerToFactoryMap.set(layerGroup, glyphFactory);

            return layerGroup;
          }));
      } else {
        obs = this.glyphLayerService.getAggregatedGlyphLayer(o, this.bedGlyphOptions$)
        .pipe(
          map(([glyphFactory, backgroundFactory]) => {

          const glyphLayer = glyphFactory.createOverlay(this.mymap);

          const bgLayer = backgroundFactory.createOverlay();

          // Create a layer group
          const layerGroup = L.layerGroup([bgLayer, glyphLayer]);

          this.layerToFactoryMap.set(layerGroup, glyphFactory);

          return layerGroup;
        }));
      }

      this.glyphLayerSubscription = obs.subscribe(layerGroup => {
        this.aggregationLevelToGlyphMap.set(`${o.aggregationLevel}-${o.forceDirectedOn}`, layerGroup);

        this.showGlyphLayer(layerGroup);
      });
    }
  }

  private showGlyphLayer(l: L.LayerGroup) {
    this.removeGlyphMapLayers();

    this.mymap.addLayer(l);

    (this.layerToFactoryMap.get(l) as unknown as GlyphLayer).setVisibility(true);

    if (l.getLayers().length > 1) {

      // aggregation glyph layer groups
      (l.getLayers()[1] as SVGOverlay).bringToFront();


    } else {

      // single glyph layer group (only contains one item)
      (l.getLayers()[0] as SVGOverlay).bringToFront();
    }
  }

  private removeCaseChoroplethLayers() {
    // remove all layers
    this.covidNumberCaseOptionsKeyToLayer.forEach(l => {
      this.mymap.removeLayer(l);
    });
  }

  private updateCaseChoroplethLayers(opt: CovidNumberCaseOptions) {
    if (!opt || !opt.enabled) {
      this.caseChoroplethLayerChange.emit(null);
      this.removeCaseChoroplethLayers();
      return;
    }

    const key = this.caseChoroplehtLayerService.getKeyCovidNumberCaseOptions(opt);

    this.caseChoroplethSubscription = this.caseChoroplehtLayerService.getLayer(opt)
    .subscribe(factory => {
      const l = factory.createOverlay();

      this.removeCaseChoroplethLayers();

      this.covidNumberCaseOptionsKeyToLayer.set(key, l);

      this.layerToFactoryMap.set(l, factory);

      this.mymap.addLayer(l);

      this.caseChoroplethLayerChange.emit(factory as CaseChoropleth);

      l.bringToBack();

      // update the glyph map to put it in the front:
      this.updateGlyphMapLayers(this._mapOptions.bedGlyphOptions);
    });
  }

  private removeBedChoroplethLayers() {
    // remove active layer
    if (this._lastBedCoroplethLayer) {
      this.mymap.removeLayer(this._lastBedCoroplethLayer);
    }
  }

  private updateBedBackgroundLayer(o: BedBackgroundOptions) {
    if(o.enabled === false) {
      this.removeBedChoroplethLayers();
      return;
    }

    if(o.aggregationLevel === AggregationLevel.none) {
      this.removeBedChoroplethLayers();
      throw 'AggregationLevel must not be none on bed background layer';
    }

    if(o.enabled) {

      this.bedChoroplethSubscription = this.bedChoroplethLayerService.getQualitativeLayer(o).subscribe(factory => {

        const layer = factory.createOverlay();

        this.removeBedChoroplethLayers();

        this.mymap.addLayer(layer);

        this._lastBedCoroplethLayer = layer;

        layer.bringToBack();
      });

    }
  }
}

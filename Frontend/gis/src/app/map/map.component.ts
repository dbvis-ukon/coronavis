import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';

import * as L from 'leaflet';
import {GeoJSON, LatLng, LatLngTuple, SVGOverlay} from 'leaflet';
import 'mapbox-gl';
import 'mapbox-gl-leaflet';
// import 'leaflet-mapbox-gl';
import {Overlay} from './overlays/overlay';
import {FeatureCollection} from 'geojson';
import {Subject, Observable} from 'rxjs';
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
import { SimpleGlyphLayer } from './overlays/simple-glyph.layer';
import { switchMap, map } from 'rxjs/operators';
import {APP_CONFIG_KEY, MAP_VIEW_KEY, MAP_ZOOM_KEY} from "../../constants";
import {MatSnackBar} from "@angular/material/snack-bar";


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
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

  @Output()
  caseChoroplethLayerChange: EventEmitter<CaseChoropleth> = new EventEmitter();

  // private layerControl: L.Control.Layers;

  private mymap: L.Map;

  private choropletDataMap = new Map<AggregationLevel, FeatureCollection>();

  private layerToFactoryMap = new Map<L.SVGOverlay | L.LayerGroup<any>, Overlay<FeatureCollection>>();

  private aggregationLevelToGlyphMap = new Map<AggregationLevel, L.LayerGroup<any>>();

  private osmHospitalsLayer: L.GeoJSON<any>;

  private osmHeliportsLayer: L.GeoJSON<any>;

  private covidNumberCaseOptionsKeyToLayer = new Map<String, L.GeoJSON<any>>();

  private _lastBedCoroplethLayer: L.GeoJSON<any> | null;

  constructor(
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private glyphLayerService: GlyphLayerService,
    private caseChoroplehtLayerService: CaseChoroplethLayerService,
    private osmLayerService: OSMLayerService,
    private snackbar: MatSnackBar
  ) {
  }

  ngOnInit() {
    const tiledMap = L.tileLayer(
        `${environment.tileServerUrl}{z}/{x}/{y}.png`,
        {
          tileSize: 256,
          // zoomOffset: -1,
          // attribution: '© <a href="https://apps.mapbox.com/feedback/">Mapbox</a> © ' +
          //   '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });

    // create map, set initial view to basemap and zoom level to center of BW
    const defaultView: LatLngTuple = [48.6813312, 9.0088299];
    const defaultZoom = 9;

    // let initialView = JSON.parse(localStorage.getItem(MAP_VIEW_KEY))
    // let initialZoom = +localStorage.getItem(MAP_ZOOM_KEY);

    // if (initialView && initialZoom) {
    //   let snackbar = this.snackbar.open("Der Kartenausschnitt aus Ihrem letzten Besuch wurde wiederhergestellt", "Zurücksetzen", {
    //     politeness: "polite",
    //     duration: 40000
    //   });
    //   snackbar.onAction().subscribe(() => {
    //     localStorage.removeItem(MAP_ZOOM_KEY);
    //     localStorage.removeItem(MAP_VIEW_KEY);
    //   })
    // } else {
    //   initialView = defaultView;
    //   initialZoom = defaultZoom;
    // }

    this.mymap = L.map('main', {
      minZoom: 6,
      maxZoom: 11,
      layers: [tiledMap],
      zoomControl: false
    }).setView(defaultView, defaultZoom);

    this.mymap.on('moveend', () => {
      localStorage.setItem(MAP_VIEW_KEY, JSON.stringify(this.mymap.getBounds().getCenter()));
      localStorage.setItem(MAP_ZOOM_KEY, "" + this.mymap.getZoom());
    });

    new L.Control.Zoom({position: 'topright'}).addTo(this.mymap);

    this.updateMap(this._mapOptions);
  }

  private updateMap(mo: MapOptions) {
    if (!this.mymap) {
      return;
    }


    this.updateGlyphMapLayers(mo.bedGlyphOptions);

    this.bedGlyphOptions$.next(mo.bedGlyphOptions);

    this.updateBedBackgroundLayer(mo.bedBackgroundOptions);

    this.updateCaseChoroplethLayers(mo.covidNumberCaseOptions);

    if (mo.showOsmHospitals) {
      this.osmLayerService.getOSMHospitalLayer()
      .subscribe(l => {
        this.osmHospitalsLayer = l.createOverlay();
        this.mymap.addLayer(this.osmHospitalsLayer);
      })
    } else if (this.osmHospitalsLayer) {
      this.mymap.removeLayer(this.osmHospitalsLayer);
    }

    if (mo.showOsmHeliports) {
      this.osmLayerService.getOSMHeliportLayer()
      .subscribe(l => {
        this.osmHeliportsLayer = l.createOverlay();
        this.mymap.addLayer(this.osmHeliportsLayer);
      })
    } else if (this.osmHeliportsLayer) {
      this.mymap.removeLayer(this.osmHeliportsLayer);
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
    if(this.aggregationLevelToGlyphMap.has(o.aggregationLevel)) {

      this.showGlyphLayer(this.aggregationLevelToGlyphMap.get(o.aggregationLevel));

    } else {
      // dynamically create the map and load data from api

      let obs: Observable<L.LayerGroup>;
      if(o.aggregationLevel === AggregationLevel.none) {
        obs = this.glyphLayerService.getSimpleGlyphLayer(this.bedGlyphOptions$)
        .pipe(
          map(glyphFactory => {
            const glyphLayer = glyphFactory.createOverlay(this.mymap);

            const layerGroup = L.layerGroup([glyphLayer]);

            this.layerToFactoryMap.set(layerGroup, glyphFactory);

            return layerGroup;
          }));
      } else {
        obs = this.glyphLayerService.getAggregatedGlyphLayer(o.aggregationLevel, this.bedGlyphOptions$)
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

      obs.subscribe(layerGroup => {
        this.aggregationLevelToGlyphMap.set(o.aggregationLevel, layerGroup);

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

    this.caseChoroplehtLayerService.getLayer(opt)
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

      this.bedChoroplethLayerService.getQualitativeLayer(o).subscribe(factory => {

        const layer = factory.createOverlay();

        this.removeBedChoroplethLayers();

        this.mymap.addLayer(layer);

        this._lastBedCoroplethLayer = layer;

        layer.bringToBack();
      });

    }
  }
}

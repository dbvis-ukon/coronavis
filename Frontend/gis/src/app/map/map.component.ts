import {
  Component,
  OnInit,
  Input,
  ViewEncapsulation,
  IterableDiffers,
  DoCheck,
  IterableChangeRecord,
  ViewChild,
  EventEmitter,
  Output
} from '@angular/core';

import * as L from 'leaflet';
import 'mapbox-gl';
import 'mapbox-gl-leaflet';
// import 'leaflet-mapbox-gl';
import { Overlay } from './overlays/overlay';
import { SimpleGlyphLayer } from './overlays/simple-glyph.layer';
import { DiviHospitalsService, DiviHospital } from '../services/divi-hospitals.service';
import { TooltipService } from '../services/tooltip.service';
import {GeoJSON, SVGOverlay} from 'leaflet';
import { ColormapService } from '../services/colormap.service';
import { AggregatedGlyphLayer } from './overlays/aggregated-glyph.layer';
import {DataService} from "../services/data.service";
import {HospitallayerService} from "../services/hospitallayer.service";
import {FeatureCollection} from "geojson";
import {Subject, forkJoin} from "rxjs";
import {GlyphHoverEvent} from "./events/glyphhover";
import { LandkreiseHospitalsLayer } from './overlays/landkreishospitals';
import { HospitalLayer } from './overlays/hospital';
import { HelipadLayer } from './overlays/helipads';
import { CaseChoropleth } from './overlays/casechoropleth';

export enum AggregationLevel {
  none = 'none',
  county = 'county',
  governmentDistrict = 'governmentDistrict',
  state = 'state'
}

export enum CovidNumberCaseChange {
  absolute = 'abs',

  relative = 'rel'
}

export enum CovidNumberCaseTimeWindow {
  
  twentyFourhours = '24h',
  
  seventyTwoHours = '72h',
  
  all = 'all',
}

export enum CovidNumberCaseType {

  cases = 'cases',

  deaths = 'deaths'

}

export interface CovidNumberCaseOptions {

  enabled?: boolean;

  change: CovidNumberCaseChange;

  timeWindow: CovidNumberCaseTimeWindow;

  type: CovidNumberCaseType;

}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  // super important, otherwise the defined css doesn't get added to dynamically created elements, for example, from D3.
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, DoCheck {

  @ViewChild('main') main;

  @Input() overlays: Array<Overlay<FeatureCollection>> = [];
  iterableDiffer: any;

  private _aggregationLevel: AggregationLevel;

  @Input()
  set aggregationLevel(agg: AggregationLevel) {
    this._aggregationLevel = agg;

    // show new layer
    this.updateGlyphMapLayers(agg);
  }

  get aggregationLevel(): AggregationLevel {
    return this._aggregationLevel;
  }

  @Output()
  aggregationLevelChange: EventEmitter<AggregationLevel> = new EventEmitter();


  private _showOsmHospitals: boolean;

  @Input()
  set showOsmHospitals(val: boolean) {
    this._showOsmHospitals = val;

    if(!this.mymap) {
      return;
    }

    if(val) {
      this.mymap.addLayer(this.osmHospitalsLayer);
    } else {
      this.mymap.removeLayer(this.osmHospitalsLayer);
    }
  }

  get showOsmHospitals(): boolean {
    return this._showOsmHospitals;
  }

  private _showOsmHeliports: boolean;

  @Input()
  set showOsmHeliports(val: boolean) {
    this._showOsmHeliports = val;

    if(!this.mymap) {
      return;
    }

    if(val) {
      this.mymap.addLayer(this.osmHeliportsLayer);
    } else {
      this.mymap.removeLayer(this.osmHeliportsLayer);
    }
  }

  get showOsmHeliports(): boolean {
    return this._showOsmHeliports;
  }

  private _caseChoroplethOptions: CovidNumberCaseOptions;

  @Input()
  set caseChoroplethOptions(opt: CovidNumberCaseOptions) {
    this._caseChoroplethOptions = opt;

    // show new layer
    this.updateCaseChoroplethLayers(opt);
  }

  get caseChoroplethOptions(): CovidNumberCaseOptions {
    return this._caseChoroplethOptions;
  }

  private layerControl: L.Control.Layers;

  private mymap: L.Map;

  private glyphLayerOverlay: SVGOverlay;

  private aggHospitalCounty: SVGOverlay;

  private aggHospitalGovernmentDistrict: SVGOverlay;

  private aggHospitalState: SVGOverlay;

  private choroplethLayerMap = new Map<String, GeoJSON>();

  private layerToFactoryMap = new Map<L.SVGOverlay | L.LayerGroup<any>, Overlay<FeatureCollection>>();

  private aggregationLevelToGlyphMap = new Map<AggregationLevel, L.SVGOverlay | L.LayerGroup<any>>();

  private osmHospitalsLayer: L.GeoJSON<any>;

  private osmHeliportsLayer: L.GeoJSON<any>;

  private covidNumberCaseOptionsKeyToLayer = new Map<String, L.GeoJSON<any>>();

  constructor(
    private iterable: IterableDiffers,
    private diviHospitalsService: DiviHospitalsService,
    private dataService: DataService,
    private tooltipService: TooltipService,
    private hospitallayerService: HospitallayerService,
    private colormapService: ColormapService
  ) {
    this.iterableDiffer = this.iterable.find(this.overlays).create();
  }

  ngOnInit() {
    // // empty tiles
    // const emptyTiles = L.tileLayer('');

    // // use osm tiles
    // const openstreetmap = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
    //   maxZoom: 19,
    //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // });

    // const token = 'pk.eyJ1IjoianVyaWIiLCJhIjoiY2s4MndsZTl0MDR2cDNobGoyY3F2YngyaiJ9.xwBjxEn_grzetKOVZDcyqA';
    // const mennaMap = L.tileLayer(
    //   'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=' + token, {
    //       tileSize: 512,
    //       zoomOffset: -1,
    //       attribution: '© <a href="https://apps.mapbox.com/feedback/">Mapbox</a> © ' +
    //       '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    //   });


    const juriMap = L.mapboxGL({
      accessToken: 'pk.eyJ1IjoianVyaWIiLCJhIjoiY2s4MndsZTl0MDR2cDNobGoyY3F2YngyaiJ9.xwBjxEn_grzetKOVZDcyqA',
      style: 'mapbox://styles/jurib/ck82xkh3z3i7b1iodexbt39x9'
    });

    // create map, set initial view to basemap and zoom level to center of BW
    this.mymap = L.map('main', {
      minZoom: 6,
      maxZoom: 12,
      layers: [juriMap]
    }).setView([48.6813312, 9.0088299], 9);
    // this.mymap.on('viewreset', () => this.updateSvg());
    // this.mymap.on('zoom', () => this.updateSvg());


    // create maps and overlay objects for leaflet control
    const baseMaps = {
      // Empty: emptyTiles,
      // OpenStreetMap: openstreetmap,
      // MennaMap: mennaMap,
      BaseMap: juriMap
      // OpenStreetMap: basemap,
      // MapTiler: gl
    };

    this.mymap.on('overlayadd', event => {
      if (this.glyphLayerOverlay) {
        this.glyphLayerOverlay.bringToFront();
      }
      if (this.aggHospitalCounty) {
        this.aggHospitalCounty.bringToFront();
      }
      if (this.aggHospitalGovernmentDistrict) {
        this.aggHospitalGovernmentDistrict.bringToFront();
      }
      if (this.aggHospitalState) {
        this.aggHospitalState.bringToFront();
      }
    });

    // add a control which lets us toggle maps and overlays
    this.layerControl = L.control.layers(baseMaps);
    this.layerControl.addTo(this.mymap);

    // Choropleth layers on hover
    this.hospitallayerService.getLayers().subscribe(layer => {
      this.choroplethLayerMap.set(layer.name, layer.createOverlay());
    });
    const layerEvents: Subject<GlyphHoverEvent> = new Subject<GlyphHoverEvent>();
    layerEvents.subscribe(event => {
      const layer = this.choroplethLayerMap.get(event.name);
      if (layer) {
        if (event.type === "enter") {
          layer.bringToBack();
          this.mymap.addLayer(layer);
        } else {
          this.mymap.removeLayer(layer);
        }
      }
    });

    // init the glyph layers
    forkJoin([
      // 0
      this.diviHospitalsService.getDiviHospitals(),
      // 1
      this.diviHospitalsService.getDiviHospitalsCounties(),
      this.dataService.getHospitalsLandkreise(),
      // 3
      this.diviHospitalsService.getDiviHospitalsGovernmentDistrict(),
      this.dataService.getHospitalsRegierungsbezirke(),
      // 5
      this.diviHospitalsService.getDiviHospitalsStates(),
      this.dataService.getHospitalsBundeslaender()
    ])
    .subscribe(result => {
      const simpleGlyphFactory = new SimpleGlyphLayer('ho_none', result[0] as DiviHospital[], this.tooltipService, this.colormapService);
      const simpleGlyphLayer = simpleGlyphFactory.createOverlay(this.mymap);
      this.aggregationLevelToGlyphMap.set(AggregationLevel.none, simpleGlyphLayer);
      this.layerToFactoryMap.set(simpleGlyphLayer, simpleGlyphFactory);
      
      // TODO : this is just for debug
      this.layerControl.addOverlay(simpleGlyphLayer, simpleGlyphFactory.name);


      this.addGlyphMap(result, 1, AggregationLevel.county, 'ho_county', 'landkreise', layerEvents);
      this.addGlyphMap(result, 3, AggregationLevel.governmentDistrict, 'ho_governmentdistrict', 'regierungsbezirke', layerEvents);
      this.addGlyphMap(result, 5, AggregationLevel.state, 'ho_state', 'bundeslander', layerEvents);
      

      // init map with the current aggregation level
      this.updateGlyphMapLayers(this._aggregationLevel);
    });

    this.dataService.getOSMHospitals().toPromise().then((val: FeatureCollection) => {
      const f = new HospitalLayer('Hospitals', val, this.tooltipService);
      this.osmHospitalsLayer = f.createOverlay();
    });

    this.dataService.getOSHelipads().toPromise().then((val: FeatureCollection) => {
      const f = new HelipadLayer('Helipads', val, this.tooltipService);
      this.osmHeliportsLayer = f.createOverlay();
    });


    // CASE Maps
    this.dataService.getCaseData().subscribe(data => {

      this.initCaseChoroplethLayer({type: CovidNumberCaseType.cases, timeWindow: CovidNumberCaseTimeWindow.all, change: CovidNumberCaseChange.absolute}, data);
      this.initCaseChoroplethLayer({type: CovidNumberCaseType.deaths, timeWindow: CovidNumberCaseTimeWindow.all, change: CovidNumberCaseChange.absolute}, data);

      this.initCaseChoroplethLayer({type: CovidNumberCaseType.cases, timeWindow: CovidNumberCaseTimeWindow.twentyFourhours, change: CovidNumberCaseChange.absolute}, data);
      this.initCaseChoroplethLayer({type: CovidNumberCaseType.deaths, timeWindow: CovidNumberCaseTimeWindow.twentyFourhours, change: CovidNumberCaseChange.absolute}, data);

      this.initCaseChoroplethLayer({type: CovidNumberCaseType.cases, timeWindow: CovidNumberCaseTimeWindow.seventyTwoHours, change: CovidNumberCaseChange.absolute}, data);
      this.initCaseChoroplethLayer({type: CovidNumberCaseType.deaths, timeWindow: CovidNumberCaseTimeWindow.seventyTwoHours, change: CovidNumberCaseChange.absolute}, data);
      
      this.initCaseChoroplethLayer({type: CovidNumberCaseType.cases, timeWindow: CovidNumberCaseTimeWindow.twentyFourhours, change: CovidNumberCaseChange.relative}, data);
      this.initCaseChoroplethLayer({type: CovidNumberCaseType.deaths, timeWindow: CovidNumberCaseTimeWindow.twentyFourhours, change: CovidNumberCaseChange.relative}, data);

      this.initCaseChoroplethLayer({type: CovidNumberCaseType.cases, timeWindow: CovidNumberCaseTimeWindow.seventyTwoHours, change: CovidNumberCaseChange.relative}, data);
      this.initCaseChoroplethLayer({type: CovidNumberCaseType.deaths, timeWindow: CovidNumberCaseTimeWindow.seventyTwoHours, change: CovidNumberCaseChange.relative}, data);

    });

    this.mymap.on('zoom', this.semanticZoom);
  }

  /**
   * If the input data changes, update the layers
   * @param changes the angular changes object
   */
  ngDoCheck(): void {
    const changes = this.iterableDiffer.diff(this.overlays);
    if (changes) {

      changes.forEachAddedItem((newOverlay: IterableChangeRecord<Overlay<FeatureCollection>>) => {
        const overlay = newOverlay.item;

        const overlayLayer = overlay.createOverlay(this.mymap);
        this.layerControl.addOverlay(overlayLayer, overlay.name);

        if (overlay.enableDefault) {
          this.mymap.addLayer(overlayLayer);
        }
      });
    }
  }

  semanticZoom() {
    // if (!this.aggHospitalCounty || !this.aggHospitalGovernmentDistrict) {
    //   return;
    // }
    // const zoom = this.mymap.getZoom();

    // if (zoom >= 10) {
    //   this.mymap.removeLayer(this.aggHospitalCounty);
    //   this.mymap.removeLayer(this.aggHospitalGovernmentDistrict);
    // } else if (zoom >= 7 && zoom < 10) {
    //   this.mymap.addLayer(this.aggHospitalCounty);
    //   this.mymap.removeLayer(this.aggHospitalGovernmentDistrict);
    // } else {
    //   this.mymap.removeLayer(this.aggHospitalCounty);
    //   this.mymap.addLayer(this.aggHospitalGovernmentDistrict);
    // }
  }

  private addGlyphMap(result: any[], index: number, agg: AggregationLevel, name: string, granularity: string, layerEvents: Subject<GlyphHoverEvent>) {
    const factory = new AggregatedGlyphLayer(name, granularity, result[index], this.tooltipService, this.colormapService, this.hospitallayerService, layerEvents);
    const layer = factory.createOverlay(this.mymap);


    const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result[index+1], this.tooltipService);
    const layerBg = factoryBg.createOverlay();


    // Create a layer group
    const layerGroup = L.layerGroup([layerBg, layer]);

    this.aggregationLevelToGlyphMap.set(agg, layerGroup);

    this.layerToFactoryMap.set(layerGroup, factory);

    // TODO : this is just for debug
    this.layerControl.addOverlay(layerGroup, factory.name);
  }

  private updateGlyphMapLayers(agg: AggregationLevel) {
    // remove all layers
    this.aggregationLevelToGlyphMap.forEach(l => {
      this.mymap.removeLayer(l);
    });

    if(!this.aggregationLevelToGlyphMap.has(agg)) {
      throw 'No glyph map for aggregation ' + agg + ' found';
    }

    this.mymap.addLayer(this.aggregationLevelToGlyphMap.get(agg));
  }

  private getKeyCovidNumberCaseOptions(v: CovidNumberCaseOptions) {
    return `${v.change}-${v.timeWindow}-${v.type}`;
  }

  private initCaseChoroplethLayer(o: CovidNumberCaseOptions, data: FeatureCollection) {
    const key = this.getKeyCovidNumberCaseOptions(o);
    const f = new CaseChoropleth(key, data, o, this.tooltipService, this.colormapService);

    this.covidNumberCaseOptionsKeyToLayer.set(key, f.createOverlay());
  }

  private updateCaseChoroplethLayers(opt: CovidNumberCaseOptions) {
    // remove all layers
    this.covidNumberCaseOptionsKeyToLayer.forEach(l => {
      this.mymap.removeLayer(l);
    });

    if(!opt || !opt.enabled) {
      return;
    }

    const key = this.getKeyCovidNumberCaseOptions(opt);

    if(!this.covidNumberCaseOptionsKeyToLayer.has(key)) {
      throw 'No covidNumberCaseCoropleth for ' + key + ' found';
    }

    this.mymap.addLayer(this.covidNumberCaseOptionsKeyToLayer.get(key));
  }
}

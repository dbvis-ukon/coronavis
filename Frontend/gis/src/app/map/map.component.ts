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
import * as d3 from 'd3';
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
import {ChoroplethLayer} from "./overlays/choropleth";
import {FeatureCollection} from "geojson";
import {Subject, forkJoin} from "rxjs";
import {GlyphHoverEvent} from "./events/glyphhover";
import { LandkreiseHospitalsLayer } from './overlays/landkreishospitals';

export enum AggregationLevel {
  none = 'none',
  county = 'county',
  governmentDistrict = 'governmentDistrict',
  state = 'state'
}

export enum CovidNumberCaseChange {
  absolute,

  relative
}

export enum CovidNumberCaseTimeWindow {
  
  twentyFourhours,
  
  seventyTwoHours,
  
  all,
}

export enum CovidNumberCaseType {

  cases,

  deaths

}

export class CovidNumberCaseOptions {

  change: CovidNumberCaseChange;

  timeWindow: CovidNumberCaseTimeWindow;

  type: CovidNumberCaseType;

  /**
   * this should be used for maps
   */
  getKey(): string {
    return `${this.change}-${this.timeWindow}-${this.type}`;
  }

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

  private layerControl: L.Control.Layers;

  private mymap: L.Map;
  private svg: d3.Selection<SVGElement, unknown, HTMLElement, any>;

  private gHostpitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;

  private glyphLayerOverlay: SVGOverlay;

  private aggHospitalCounty: SVGOverlay;

  private aggHospitalGovernmentDistrict: SVGOverlay;

  private aggHospitalState: SVGOverlay;

  private choroplethLayerMap = new Map<String, GeoJSON>();

  private layerToFactoryMap = new Map<L.SVGOverlay | L.LayerGroup<any>, Overlay<FeatureCollection>>();

  private aggregationLevelToGlyphMap = new Map<AggregationLevel, L.SVGOverlay | L.LayerGroup<any>>();

  private _aggregationLevel: AggregationLevel;

  @Output()
  aggregationLevelChange: EventEmitter<AggregationLevel> = new EventEmitter();

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

  @Input()
  set aggregationLevel(agg: AggregationLevel) {
    this._aggregationLevel = agg;

    // show new layer
    this.updateGlyphMapLayers(agg);
  }

  get aggregationLevel(): AggregationLevel {
    return this._aggregationLevel;
  }

  ngOnInit() {
    // empty tiles
    const emptyTiles = L.tileLayer('');

    // use osm tiles
    const openstreetmap = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const token = 'pk.eyJ1IjoianVyaWIiLCJhIjoiY2s4MndsZTl0MDR2cDNobGoyY3F2YngyaiJ9.xwBjxEn_grzetKOVZDcyqA';
    const mennaMap = L.tileLayer(
      'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=' + token, {
          tileSize: 512,
          zoomOffset: -1,
          attribution: '© <a href="https://apps.mapbox.com/feedback/">Mapbox</a> © ' +
          '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });


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
}

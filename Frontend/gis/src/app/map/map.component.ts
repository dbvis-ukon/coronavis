import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';

import * as L from 'leaflet';
import {GeoJSON, SVGOverlay} from 'leaflet';
import 'mapbox-gl';
import 'mapbox-gl-leaflet';
// import 'leaflet-mapbox-gl';
import {Overlay} from './overlays/overlay';
import {SimpleGlyphLayer} from './overlays/simple-glyph.layer';
import {DiviHospital, DiviHospitalsService} from '../services/divi-hospitals.service';
import {TooltipService} from '../services/tooltip.service';
import {ColormapService} from '../services/colormap.service';
import {AggregatedGlyphLayer} from './overlays/aggregated-glyph.layer';
import {DataService} from '../services/data.service';
import {HospitallayerService} from '../services/hospitallayer.service';
import {FeatureCollection} from 'geojson';
import {forkJoin, Subject} from 'rxjs';
import {LandkreiseHospitalsLayer} from './overlays/landkreishospitals';
import {HospitalLayer} from './overlays/hospital';
import {HelipadLayer} from './overlays/helipads';
import {CaseChoropleth} from './overlays/casechoropleth';
import {AggregationLevel} from './options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from './options/covid-number-case-options';
import {BedType} from './options/bed-type.enum';
import {MapOptions} from './options/map-options';
import {BedBackgroundOptions} from './options/bed-background-options';
import {BedGlyphOptions} from './options/bed-glyph-options';
import {MatDialog} from '@angular/material/dialog';


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

    if (!this.mymap) {
      return;
    }


    this.updateGlyphMapLayers(mo.bedGlyphOptions);

    this.bedGlyphOptions$.next(mo.bedGlyphOptions);

    this.updateBedBackgroundLayer(mo.bedBackgroundOptions);

    this.updateCaseChoroplethLayers(mo.covidNumberCaseOptions);

    if (mo.showOsmHospitals) {
      this.mymap.addLayer(this.osmHospitalsLayer);
    } else if (this.osmHospitalsLayer) {
      this.mymap.removeLayer(this.osmHospitalsLayer);
    }

    if (mo.showOsmHeliports) {
      this.mymap.addLayer(this.osmHeliportsLayer);
    } else if (this.osmHeliportsLayer) {
      this.mymap.removeLayer(this.osmHeliportsLayer);
    }
  }

  get mapOptions(): MapOptions {
    return this._mapOptions;
  }

  @Output()
  caseChoroplethLayerChange: EventEmitter<CaseChoropleth> = new EventEmitter();

  // private layerControl: L.Control.Layers;

  private mymap: L.Map;

  private choropletDataMap = new Map<AggregationLevel, FeatureCollection>();

  private choroplethLayerMap = new Map<String, GeoJSON>();

  private layerToFactoryMap = new Map<L.SVGOverlay | L.LayerGroup<any>, Overlay<FeatureCollection>>();

  private aggregationLevelToGlyphMap = new Map<AggregationLevel, L.LayerGroup<any>>();

  private osmHospitalsLayer: L.GeoJSON<any>;

  private osmHeliportsLayer: L.GeoJSON<any>;

  private covidNumberCaseOptionsKeyToLayer = new Map<String, L.GeoJSON<any>>();

  private _lastBedCoroplethLayer: L.GeoJSON<any> | null;

  constructor(
    private diviHospitalsService: DiviHospitalsService,
    private dataService: DataService,
    private tooltipService: TooltipService,
    private hospitallayerService: HospitallayerService,
    private colormapService: ColormapService,
    private matDialog: MatDialog
  ) {
  }

  ngOnInit() {
    const apiToken = 'pk.eyJ1IjoiOTA2M2RlMTBlMWQ5IiwiYSI6ImNrODZicXpseTBjcHQzbW84d213aXBiOGgifQ.St1C8STbyTrHF7HwzIkUPg';
    const styleToken = '9063de10e1d9/ck86c318i021d1iqfgvhln1ap';
    const tiledMap = L.tileLayer(
      `https://api.mapbox.com/styles/v1/${styleToken}/tiles/{z}/{x}/{y}?access_token=${apiToken}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://apps.mapbox.com/feedback/">Mapbox</a> © ' +
          '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });

    /*const webGlMap = L.mapboxGL({
      accessToken: 'pk.eyJ1IjoianVyaWIiLCJhIjoiY2s4MndsZTl0MDR2cDNobGoyY3F2YngyaiJ9.xwBjxEn_grzetKOVZDcyqA',
      style: 'mapbox://styles/jurib/ck82xkh3z3i7b1iodexbt39x9'
    });*/

    // create map, set initial view to basemap and zoom level to center of BW
    this.mymap = L.map('main', {
      minZoom: 6,
      maxZoom: 12,
      layers: [tiledMap],
      zoomControl: false
    }).setView([48.6813312, 9.0088299], 9);

    new L.Control.Zoom({position: 'topright'}).addTo(this.mymap);
    // this.mymap.on('viewreset', () => this.updateSvg());
    // this.mymap.on('zoom', () => this.updateSvg());


    // create maps and overlay objects for leaflet control
    // const baseMaps = {
    //   // Empty: emptyTiles,
    //   // OpenStreetMap: openstreetmap,
    //   // MennaMap: mennaMap,
    //   BaseMap: juriMap
    //   // OpenStreetMap: basemap,
    //   // MapTiler: gl
    // };

    // // add a control which lets us toggle maps and overlays
    // this.layerControl = L.control.layers(baseMaps);
    // this.layerControl.addTo(this.mymap);

    // Choropleth layers on hover
    this.hospitallayerService.getLayers().subscribe(layer => {
      this.choroplethLayerMap.set(this.getBedChoroplethKey(layer.getAggregationLevel(), layer.getGlyphState()), layer.createOverlay());
    });
    // const layerEvents: Subject<GlyphHoverEvent> = new Subject<GlyphHoverEvent>();
    // layerEvents.subscribe(event => {
      // const layer = this.choroplethLayerMap.get(event.name);
      // if (layer) {
      //   if (event.type === "enter") {
      //     layer.bringToBack();
      //     this.mymap.addLayer(layer);
      //   } else {
      //     this.mymap.removeLayer(layer);
      //   }
      // }
    // });

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
        const simpleGlyphFactory = new SimpleGlyphLayer(
          'ho_none',
          result[0] as DiviHospital[],
          this.tooltipService,
          this.colormapService,
          this.bedGlyphOptions$,
          this.matDialog
          );
        const simpleGlyphLayer = simpleGlyphFactory.createOverlay(this.mymap);
        const l = L.layerGroup([simpleGlyphLayer]);
        this.aggregationLevelToGlyphMap.set(AggregationLevel.none, l);
        this.layerToFactoryMap.set(simpleGlyphLayer, simpleGlyphFactory);


        this.addGlyphMap(result, 1, AggregationLevel.county, 'ho_county', 'landkreise');
        this.addGlyphMap(result, 3, AggregationLevel.governmentDistrict, 'ho_governmentdistrict', 'regierungsbezirke');
        this.addGlyphMap(result, 5, AggregationLevel.state, 'ho_state', 'bundeslander');


        // init map with the current aggregation level
        this.updateGlyphMapLayers(this._mapOptions.bedGlyphOptions);
      });

    this.dataService.getOSMHospitals().toPromise().then((val: FeatureCollection) => {
      const f = new HospitalLayer('Hospitals', val, this.tooltipService);
      this.osmHospitalsLayer = f.createOverlay();
    });

    this.dataService.getOSHelipads().toPromise().then((val: FeatureCollection) => {
      const f = new HelipadLayer('Helipads', val, this.tooltipService);
      this.osmHeliportsLayer = f.createOverlay();
    });

    this.dataService.getCaseData(AggregationLevel.county).subscribe(data => {
      this.choropletDataMap.set(AggregationLevel.county, data);
    });
    this.dataService.getCaseData(AggregationLevel.governmentDistrict).subscribe(data => {
      this.choropletDataMap.set(AggregationLevel.governmentDistrict, data);
    });
    this.dataService.getCaseData(AggregationLevel.state).subscribe(data => {
      this.choropletDataMap.set(AggregationLevel.state, data);
    });

    this.mymap.on('zoom', this.semanticZoom);
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

  private addGlyphMap(result: any[], index: number, agg: AggregationLevel, name: string, granularity: string) {
    const factory = new AggregatedGlyphLayer(
      name,
      granularity,
      result[index],
      this.tooltipService,
      this.colormapService,
      this.hospitallayerService,
      this.bedGlyphOptions$
    );

    const layer = factory.createOverlay(this.mymap);


    const factoryBg = new LandkreiseHospitalsLayer(name + '_bg', result[index + 1], this.tooltipService);
    const layerBg = factoryBg.createOverlay();


    // Create a layer group
    const layerGroup = L.layerGroup([layerBg, layer]);

    this.aggregationLevelToGlyphMap.set(agg, layerGroup);

    this.layerToFactoryMap.set(layerGroup, factory);
  }

  private updateGlyphMapLayers(o: BedGlyphOptions) {
    // remove all layers
    this.aggregationLevelToGlyphMap.forEach(l => {
      this.mymap.removeLayer(l);
    });

    if(o.enabled === false) {
      return;
    }

    if (!this.aggregationLevelToGlyphMap.has(o.aggregationLevel)) {
      throw 'No glyph map for aggregation ' + o.aggregationLevel + ' found';
    }

    const l = this.aggregationLevelToGlyphMap.get(o.aggregationLevel);
    this.mymap.addLayer(l);

    if (l.getLayers().length > 1) {

      // aggregation glyph layer groups
      (l.getLayers()[1] as SVGOverlay).bringToFront();


    } else {

      // single glyph layer group (only contains one item)
      (l.getLayers()[0] as SVGOverlay).bringToFront();
    }
  }

  private getKeyCovidNumberCaseOptions(v: CovidNumberCaseOptions) {
    return `${v.change}-${v.timeWindow}-${v.type}-${v.normalization}-${v.aggregationLevel}`;
  }

  private initCaseChoroplethLayer(o: CovidNumberCaseOptions, data: FeatureCollection) {
    const key = this.getKeyCovidNumberCaseOptions(o);
    const f = new CaseChoropleth(key, data, o, this.tooltipService, this.colormapService);
    const l = f.createOverlay();
    this.covidNumberCaseOptionsKeyToLayer.set(key, l);

    this.layerToFactoryMap.set(l, f);
  }

  private updateCaseChoroplethLayers(opt: CovidNumberCaseOptions) {
    // remove all layers
    this.covidNumberCaseOptionsKeyToLayer.forEach(l => {
      this.mymap.removeLayer(l);
    });

    if (!opt || !opt.enabled) {
      this.caseChoroplethLayerChange.emit(null);
      return;
    }

    const key = this.getKeyCovidNumberCaseOptions(opt);

    if (!this.covidNumberCaseOptionsKeyToLayer.has(key)) {
      console.log(`Did not find choropleth for ${key}, generate one`);
      const data = this.choropletDataMap.get(opt.aggregationLevel);
      if (!data) {
        throw `Did not find choropleth data for ${opt.aggregationLevel}`;
      }
      this.initCaseChoroplethLayer(opt, data);
    }

    const l = this.covidNumberCaseOptionsKeyToLayer.get(key);
    this.mymap.addLayer(l);

    const factory = this.layerToFactoryMap.get(l);
    this.caseChoroplethLayerChange.emit(factory as CaseChoropleth);

    l.bringToBack();

    // update the glyph map to put it in the front:
    this.updateGlyphMapLayers(this._mapOptions.bedGlyphOptions);
  }

  private updateBedBackgroundLayer(o: BedBackgroundOptions) {
    // remove active layer
    if (this._lastBedCoroplethLayer) {
      this.mymap.removeLayer(this._lastBedCoroplethLayer);
    }

    if(o.aggregationLevel === AggregationLevel.none) {
      throw 'AggregationLevel must not be none on bed background layer';
    }

    if(o.enabled) {

      const key = this.getBedChoroplethKey(o.aggregationLevel, o.bedType);

      const layer = this.choroplethLayerMap.get(key);
      layer.bringToBack();
      this.mymap.addLayer(layer);

      this._lastBedCoroplethLayer = layer;
    }
  }

  private getBedChoroplethKey(agg: AggregationLevel, bedType: BedType) {
    return `Hospitals_${agg}_${bedType}`;
  }
}

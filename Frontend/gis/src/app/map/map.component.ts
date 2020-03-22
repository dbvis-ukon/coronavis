import { Component, OnInit, Input, ViewEncapsulation, IterableDiffers, DoCheck, IterableChangeRecord } from '@angular/core';

import * as L from 'leaflet';
import * as d3 from 'd3';
import 'mapbox-gl';
import 'mapbox-gl-leaflet';
// import 'leaflet-mapbox-gl';
import { Overlay } from './overlays/overlay';
import { SimpleGlyphLayer } from './overlays/simple-glyph.layer';
import { DiviHospitalsService, DiviHospital } from '../services/divi-hospitals.service';
import { TooltipService } from '../services/tooltip.service';
import { TooltipDemoComponent } from '../tooltip-demo/tooltip-demo.component';
import {SVGOverlay} from "leaflet";
import {DataService} from "../services/data.service";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  // super important, otherwise the defined css doesn't get added to dynamically created elements, for example, from D3.
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, DoCheck {

  @Input() overlays: Array<Overlay> = [];
  iterableDiffer: any;

  private layerControl: L.Control.Layers;

  private mymap: L.Map;
  private svg: d3.Selection<SVGElement, unknown, HTMLElement, any>;

  private gHostpitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;

  private glyphLayerOverlay: SVGOverlay;

  constructor(
    private iterable: IterableDiffers,
    private diviHospitalsService: DiviHospitalsService,
    private dataService: DataService,
    private tooltipService: TooltipService
  ) {
    this.iterableDiffer = this.iterable.find(this.overlays).create();
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
    this.mymap = L.map('main', { layers: [emptyTiles, openstreetmap, mennaMap, juriMap] }).setView([48.6813312, 9.0088299], 9);
    // this.mymap.on('viewreset', () => this.updateSvg());
    // this.mymap.on('zoom', () => this.updateSvg());


    // create maps and overlay objects for leaflet control
    const baseMaps = {
      Empty: emptyTiles,
      OpenStreetMap: openstreetmap,
      MennaMap: mennaMap,
      JuriMap: juriMap
      // OpenStreetMap: basemap,
      // MapTiler: gl
    };

    this.mymap.on("overlayadd", event => {
      // this.mymap.eachLayer(layer => console.log(layer));
      if (this.glyphLayerOverlay) {
        this.glyphLayerOverlay.bringToFront();
      }
    });

    // add a control which lets us toggle maps and overlays
    this.layerControl = L.control.layers(baseMaps);
    this.layerControl.addTo(this.mymap);

    const colorScale = d3.scaleOrdinal<string, string>().domain(['Verfügbar' , 'Begrenzt' , 'Ausgelastet' , 'Nicht verfügbar'])
        .range(['green', 'yellow', 'red', 'black']);

    this.diviHospitalsService.getDiviHospitals().subscribe(data => {
      console.log(data);
      const glyphLayer = new SimpleGlyphLayer('Simple Glyphs', this.mymap, data, this.tooltipService, this.dataService);
      this.glyphLayerOverlay = glyphLayer.createOverlay();

      // this.mymap.addLayer(glyphs.createOverlay());
      this.layerControl.addOverlay(this.glyphLayerOverlay, glyphLayer.name);
    });
  }

  /**
   * If the input data changes, update the layers
   * @param changes the angular changes object
   */
  ngDoCheck(): void {
    const changes = this.iterableDiffer.diff(this.overlays);
    if (changes) {

      changes.forEachAddedItem((newOverlay: IterableChangeRecord<Overlay>) => {
        const overlay = newOverlay.item;
        this.layerControl.addOverlay(overlay.createOverlay(), overlay.name);
      });
    }
  }
}

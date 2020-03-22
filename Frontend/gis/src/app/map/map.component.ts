import { Component, OnInit, Input, ViewEncapsulation, IterableDiffers, DoCheck, IterableChangeRecord } from '@angular/core';

import * as L from 'leaflet';
// import 'leaflet-mapbox-gl';
import { Overlay } from './overlays/overlay';
import { SimpleGlyphLayer } from './overlays/simple-glyph.layer';
import { DiviHospitalsService } from '../services/divi-hospitals.service';
import { TooltipService } from '../services/tooltip.service';

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

  constructor(
    private iterable: IterableDiffers,
    private diviHospitalsService: DiviHospitalsService,
    private tooltipService: TooltipService
  ) {
    this.iterableDiffer = this.iterable.find(this.overlays).create();
  }

  ngOnInit() {
    // use osm tiles
    const basemap = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // create map, set initial view to basemap and zoom level to center of BW
    const mymap = L.map('main', { layers: [basemap] }).setView([48.6813312, 9.0088299], 9);

    // const myL: any = L;
    // const gl = myL.mapboxGL({
    //   attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> ' +
    //   '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    //   accessToken: 'not-needed',
    //   style: 'https://api.maptiler.com/maps/72c19f15-b7fe-4f9d-bd65-d4f215e75cb6/style.json?key=yzg9qCdUXACLQHtY2KmW'
    // });


    // create maps and overlay objects for leaflet control
    const baseMaps = {
      OpenStreetMap: basemap,
      // MapTiler: gl
    };

    // add a control which lets us toggle maps and overlays
    this.layerControl = L.control.layers(baseMaps);
    this.layerControl.addTo(mymap);

    this.diviHospitalsService.getDiviHospitals().subscribe(d => {
      console.log(d);
      const glyphs = new SimpleGlyphLayer('Simple Glyphs', mymap, d, this.tooltipService);

      this.layerControl.addOverlay(glyphs.createOverlay(), glyphs.name);
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

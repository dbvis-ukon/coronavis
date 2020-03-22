import { Component, OnInit, Input, ViewEncapsulation, IterableDiffers, DoCheck, IterableChangeRecord } from '@angular/core';

import * as L from 'leaflet';
import * as d3 from 'd3';
// import 'leaflet-mapbox-gl';
import { Overlay } from './overlays/overlay';
import { SimpleGlyphLayer } from './overlays/simple-glyph.layer';
import { DiviHospitalsService, DiviHospital } from '../services/divi-hospitals.service';
import { TooltipService } from '../services/tooltip.service';
import { TooltipDemoComponent } from '../tooltip-demo/tooltip-demo.component';

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

  constructor(
    private iterable: IterableDiffers,
    private diviHospitalsService: DiviHospitalsService,
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



    // create map, set initial view to basemap and zoom level to center of BW
    this.mymap = L.map('main', { layers: [emptyTiles, openstreetmap] }).setView([48.6813312, 9.0088299], 9);
    this.mymap.on('viewreset', () => this.updateSvg());
    this.mymap.on('zoom', () => this.updateSvg());

    /* We simply pick up the SVG from the map object */
    this.svg = d3.select(this.mymap.getPanes().overlayPane).append('svg')
    .attr('width', '4000px')
    .attr('height', '4000px');


    // const myL: any = L;
    // const gl = myL.mapboxGL({
    //   attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> ' +
    //   '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    //   accessToken: 'not-needed',
    //   style: 'https://api.maptiler.com/maps/72c19f15-b7fe-4f9d-bd65-d4f215e75cb6/style.json?key=yzg9qCdUXACLQHtY2KmW'
    // });


    // create maps and overlay objects for leaflet control
    const baseMaps = {
      Empty: emptyTiles,
      OpenStreetMap: openstreetmap
      // OpenStreetMap: basemap,
      // MapTiler: gl
    };

    // add a control which lets us toggle maps and overlays
    this.layerControl = L.control.layers(baseMaps);
    this.layerControl.addTo(this.mymap);



    const colorScale = d3.scaleOrdinal<string, string>().domain(['Verfügbar' , 'Begrenzt' , 'Ausgelastet' , 'Nicht verfügbar'])
        .range(['green', 'yellow', 'red', 'black']);

    this.diviHospitalsService.getDiviHospitals().subscribe(data => {
      console.log(data);
      // const glyphs = new SimpleGlyphLayer('Simple Glyphs', this.mymap, d, this.tooltipService);

      // this.layerControl.addOverlay(glyphs.createOverlay(), glyphs.name);



      this.gHostpitals = this.svg
            .selectAll('g.hospital')
            .data<DiviHospital>(data)
            .enter()
            .append<SVGGElement>('g')
            .attr('class', 'hospital')
            .on('mouseenter', d1 => {
                console.log('mouseenter', d1);
                const evt: MouseEvent = d3.event;
                const t = this.tooltipService.openAtElementRef(TooltipDemoComponent, {x: evt.clientX, y: evt.clientY}, [
                  {
                  overlayX: 'start',
                  overlayY: 'top',
                  originX: 'end',
                  originY: 'bottom',
                  offsetX: 5,
                  offsetY: 5
                  },
                  {
                  overlayX: 'end',
                  overlayY: 'top',
                  originX: 'start',
                  originY: 'bottom',
                  offsetX: -5,
                  offsetY: 5
                  },
                  {
                  overlayX: 'start',
                  overlayY: 'bottom',
                  originX: 'end',
                  originY: 'top',
                  offsetX: 5,
                  offsetY: -5
                  },
                  {
                  overlayX: 'end',
                  overlayY: 'bottom',
                  originX: 'start',
                  originY: 'top',
                  offsetX: -5,
                  offsetY: -5
                  },
              ]);
                t.text = d1.Name;
            })
            .on('mouseout', () => this.tooltipService.close());

      const rectSize = 10;

      this.gHostpitals
          .append('rect')
          .attr('width', `${rectSize}px`)
          .attr('height', `${rectSize}px`)
          .style('fill', d1 => colorScale(d1.icuLowCare));

      this.gHostpitals
          .append('rect')
          .attr('width', `${rectSize}px`)
          .attr('height', `${rectSize}px`)
          .attr('x', `${rectSize}px`)
          .style('fill', d1 => colorScale(d1.icuHighCare));

      this.gHostpitals
          .append('rect')
          .attr('width', `${rectSize}px`)
          .attr('height', `${rectSize}px`)
          .attr('x', `${2 * rectSize}px`)
          .style('fill', d1 => colorScale(d1.ECMO));

      this.updateSvg();
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

  updateSvg() {
    console.log('update');
    if (!this.gHostpitals) {
      return;
    }

    const zoom = this.mymap.getZoom();
    console.log('zoomlevel', zoom);

    this.gHostpitals
      .attr('transform', d => {
        const p = this.mymap.latLngToLayerPoint(d.Location);

        return `translate(${p.x}, ${p.y})`;
      });
  }
}

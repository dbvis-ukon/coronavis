import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { DiviHospital } from 'src/app/services/divi-hospitals.service';
import { ColormapService } from 'src/app/services/colormap.service';
import {Point} from 'leaflet';
import {Feature, FeatureCollection} from "geojson";
import {Subject} from "rxjs";
import {HospitallayerService} from "../../services/hospitallayer.service";
import {GlyphHoverEvent} from "../events/glyphhover";

export class SimpleGlyphLayer extends Overlay<FeatureCollection> {

  private gHospitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private map: L.Map;

  constructor(
    name: string,
    private data: DiviHospital[],
    private tooltipService: TooltipService,
    private colormapService: ColormapService,
    ) {
    super(name, null);
    this.enableDefault = true;
  }


  private lastTransform;

  private labelLayout;

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }

  createOverlay(map: L.Map) {
    this.map = map;

    this.map.on('zoom', (d) => {
      this.onZoomed();
    });


    const latExtent = d3.extent(this.data, i => i.Location.lat);
    const lngExtent = d3.extent(this.data, i => i.Location.lng);

    let latLngBounds = new L.LatLngBounds([latExtent[0], lngExtent[0]], [latExtent[1], lngExtent[1]]);

    latLngBounds = latLngBounds.pad(10);

    const lpMin = this.latLngPoint(latLngBounds.getSouthWest());
    const lpMax = this.latLngPoint(latLngBounds.getNorthEast());

    // just to make everything bulletproof
    const [xMin, xMax] = d3.extent([lpMin.x, lpMax.x]);
    const [yMin, yMax] = d3.extent([lpMin.y, lpMax.y]);

    const svgElement: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);


    const colorScale = this.colormapService.getSingleHospitalColormap();

    const self = this;
    const rectSize = 10;

    const padding = 2;
    const yOffset = 10;

    this.gHospitals = d3.select(svgElement)
      .selectAll('g.hospital')
      .data<DiviHospital>(this.data)
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'hospital')
      .attr('transform', d => {
          const p = this.latLngPoint(d.Location);
          d.x = p.x;
          d.y = p.y;
          d._x = p.x;
          d._y = p.y;
          // console.log(p, d.Location);
          return `translate(${p.x}, ${p.y})`; })
      .on('mouseenter', function(d1: DiviHospital) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        // console.log('mouseenter', d1);
        t.diviHospital = d1;
        d3.select(this).raise();
      })
      .on('mouseleave', () => this.tooltipService.close());

    this.gHospitals
      .append('rect')
      .attr('width', '50')
      .attr('height', '22')
      .attr('fill', 'white')
      .attr('stroke', '#cccccc');

    this.gHospitals
      .append('text')
      .text(d1 => {
        // Hackity hack :)
        const splitted = d1.Adress.split(' ');
        return splitted[splitted.length - 1];
      })
      .attr('x', padding)
      .attr('y', '8')
      .attr('font-size', '8px');

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .style('fill', d1 => colorScale(d1.icuLowCare))
      .attr('x', padding)
      .attr('y', yOffset);

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', `${rectSize}px`)
      .style('fill', d1 => colorScale(d1.icuHighCare))
      .attr('y', yOffset)
      .attr('x', `${rectSize + padding * 2}px`);

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', `${2 * rectSize}px`)
      .style('fill', d1 => colorScale(d1.ECMO))
      .attr('y', yOffset)
      .attr('x', `${2 * rectSize + padding * 3}px`);

    this.labelLayout = this.getForceSimulation();

    // gHos
    //   .append('rect')
    //   .attr('width', '30px')
    //   .attr('height', '30px')
    //   .style('fill', d => colorScale(d.icuLowCare));
    //
    this.onZoomed();

    return L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
      zIndex: 3
    });
    // return L.svgOverlay(svgElement, this.map.getBounds());
  }

   ticked() {
    this.gHospitals
      .transition().duration(100)
      .attr('transform', (d, i) => {
      return `translate(${d.x},${d.y})`;
    });

    // this.labelLayout.alphaTarget(0.3).restart();
  }

  /*
   * Rectangular Force Collision
   * https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b
   */
  getForceSimulation(scale: number = 1): d3.Simulation<DiviHospital, undefined> {
    return d3.forceSimulation(this.data)
      .force('collision', d3.forceCollide( (d) => 30 * scale)
        .iterations(1).strength(0.2) )
      .force('x', d3.forceX((d: any) => d._x).strength(0.5))
      .force('y', d3.forceY((d: any) => d._y).strength(0.5))
      // .force('charge', d3.forceManyBody().strength(0.1))
      .on('end', () => {
        return this.ticked();
      });
  }

  onZoomed() {
    const zoom = this.map.getZoom();
    const scale = Math.pow(9 / (zoom), 3);

    this.labelLayout.stop();
    this.labelLayout.stop();
    this.labelLayout = this.getForceSimulation(scale);

    console.log('zoomed', this.map.getZoom(), scale);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(500)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });
  }
}

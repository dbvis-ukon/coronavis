import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import {TooltipService} from '../../services/tooltip.service';
import {AggregatedHospitalsState, DiviAggregatedHospital} from 'src/app/services/divi-hospitals.service';
import { ColormapService } from 'src/app/services/colormap.service';
import {FeatureCollection} from "geojson";
import {GlyphHoverEvent} from "../events/glyphhover";
import {HospitallayerService} from "../../services/hospitallayer.service";
import {Subject} from "rxjs";

export class AggregatedGlyphLayer extends Overlay<FeatureCollection> {

  private gHospitals: d3.Selection<SVGGElement, DiviAggregatedHospital, SVGElement, unknown>;
  private map: L.Map;

  constructor(
    name: string,
    private granularity: String,
    private data: DiviAggregatedHospital[],
    private tooltipService: TooltipService,
    private colormapService: ColormapService,
    private hospitallayerService: HospitallayerService,
    private eventEmitter: Subject<GlyphHoverEvent>
) {
    super(name, null);
  }

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }

  private getIcuLowScore(d: DiviAggregatedHospital) {
    const v = d.icu_low_state.Verfügbar || 0;
    const b = d.icu_low_state.Begrenzt || 0;
    const a = d.icu_low_state.Ausgelastet || 0;

    return (b * 2 + a * 3) / (v + b + a);
  }

  private getIcuHighScore(d: DiviAggregatedHospital) {
    const v = d.icu_high_state.Verfügbar || 0;
    const b = d.icu_high_state.Begrenzt || 0;
    const a = d.icu_high_state.Ausgelastet || 0;

    return (b * 2 + a * 3) / (v + b + a);
  }

  private getEcmoScore(d: DiviAggregatedHospital) {
    const v = d.ecmo_state.Verfügbar || 0;
    const b = d.ecmo_state.Begrenzt || 0;
    const a = d.ecmo_state.Ausgelastet || 0;

    return (b * 2 + a * 3) / (v + b + a);
  }

  createOverlay(map: L.Map) {
    this.map = map;

    this.map.on('zoom', () => this.onZoomed());

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

    const rectSize = 10;

    const padding = 2;
    const yOffset = 10;

    if (this.granularity === "landkreise") {
      this.data.forEach(d => console.log(d));
    }

    const icu_low_scores = this.data.map(d => this.getIcuLowScore(d));
    if (this.granularity === "landkreise") {
      console.log(icu_low_scores);
    }
    const icu_low_extent = d3.extent(icu_low_scores);
    console.log(icu_low_extent);
    const icu_low_normalizer = d3.scaleLinear()
      .domain(icu_low_extent)
      .range([0, 1]);
    const icu_high_scores = this.data.map(d => this.getIcuHighScore(d));
    if (this.granularity === "landkreise") {
      console.log(icu_high_scores);
    }
    const icu_high_extent = d3.extent(icu_high_scores);
    console.log(icu_high_extent);
    const icu_high_normalizer = d3.scaleLinear()
      .domain(icu_high_extent)
      .range([0, 1]);
    const ecmo_scores = this.data.map(d => this.getEcmoScore(d));
    if (this.granularity === "landkreise") {
      console.log(ecmo_scores);
    }
    const ecmo_extent = d3.extent(ecmo_scores);
    console.log(ecmo_extent);
    const ecmo_normalizer = d3.scaleLinear()
      .domain(ecmo_extent)
      .range([0, 1]);

    this.gHospitals = d3.select(svgElement)
      .style("pointer-events", "none")
      .selectAll('g.hospital')
      .data<DiviAggregatedHospital>(this.data)
      .enter()
      .append<SVGGElement>('g')
      .style("pointer-events", "all")
      .attr('class', 'hospital')
      .attr('transform', d => {
        const p = this.latLngPoint(d.Location);
        return `translate(${p.x - ((3 * rectSize + padding * 3) / 2)}, ${p.y - (22 / 2)})`;
      });
      // .on('mouseenter', d1 => {
      //   const evt: MouseEvent = d3.event;
      //   const t = this.tooltipService.openAtElementRef(GlyphTooltipComponent, { x: evt.clientX, y: evt.clientY });
      //   t.name = d1.Name;
      // })
      // .on('mouseout', () => this.tooltipService.close());



    this.gHospitals
      .append('rect')
      .attr('width', '50')
      .attr('height', '22')
      .attr('fill', 'white')
      .attr('stroke', '#cccccc');

    this.gHospitals
      .append('text')
      .text(d1 => d1.Name)
      .attr('x', padding)
      .attr('y', '8')
      .attr('font-size', '8px');


    const self = this;
    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', padding)
      .attr('y', yOffset)
      .style('fill', d1 => this.colormapService.getBedStatusColor(icu_low_normalizer(this.getIcuLowScore(d1))))
      .on("mouseenter", () => {
        self.eventEmitter.next(new GlyphHoverEvent(self.hospitallayerService.getName(self.granularity, "icu_low_state"), "enter"));
      })
      .on("mouseleave", () => {
        self.eventEmitter.next(new GlyphHoverEvent(self.hospitallayerService.getName(self.granularity, "icu_low_state"), "exit"));
      })

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${rectSize + padding * 2}px`)
      .style('fill', d1 => this.colormapService.getBedStatusColor(icu_high_normalizer(this.getIcuHighScore(d1))))
      .on("mouseenter", () => {
        self.eventEmitter.next(new GlyphHoverEvent(self.hospitallayerService.getName(self.granularity, "icu_high_state"), "enter"));
      })
      .on("mouseleave", () => {
        self.eventEmitter.next(new GlyphHoverEvent(self.hospitallayerService.getName(self.granularity, "icu_high_state"), "exit"));
      });

    this.gHospitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${2 * rectSize + padding * 3}px`)
      .style('fill', d1 => this.colormapService.getBedStatusColor(ecmo_normalizer(this.getEcmoScore(d1))))
      .on("mouseenter", () => {
        self.eventEmitter.next(new GlyphHoverEvent(self.hospitallayerService.getName(self.granularity, "ecmo_state"), "enter"));
      })
      .on("mouseleave", () => {
        self.eventEmitter.next(new GlyphHoverEvent(self.hospitallayerService.getName(self.granularity, "ecmo_state"), "exit"));
      });


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

  onZoomed() {
    // this.gHospitals
    //   .attr('transform', (d, i, n) => {
    //     const p = this.map.latLngToLayerPoint(d.Location);
    //     return `translate(${p.x}, ${p.y})`;
    //   });
    const zoom = this.map.getZoom();
    const scale = Math.pow(9 / (zoom), 3);

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

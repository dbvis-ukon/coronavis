import * as L from 'leaflet';
import * as d3 from 'd3';
import {Overlay} from './overlay';
import {TooltipService} from '../../services/tooltip.service';
import {DiviAggregatedHospital,
  DiviHospital,
  getLatest,
  TimestampedValue
} from 'src/app/services/divi-hospitals.service';
import { ColormapService } from 'src/app/services/colormap.service';
import {FeatureCollection} from "geojson";
import {HospitallayerService} from "../../services/hospitallayer.service";
import {Observable} from "rxjs";
import {BedGlyphOptions} from '../options/bed-glyph-options';
import {BedType} from '../options/bed-type.enum';
import {AggregatedGlyphTooltipComponent} from "../../aggregated-glyph-tooltip/aggregated-glyph-tooltip.component";
import {ForceDirectedLayout} from 'src/app/util/forceDirectedLayout';
import {GlyphLayer} from "./GlyphLayer";

export class AggregatedGlyphLayer extends Overlay<FeatureCollection> implements GlyphLayer {

  private gHospitals: d3.Selection<SVGGElement, DiviAggregatedHospital, SVGElement, unknown>;
  private map: L.Map;
  private labelLayout;

  private forceLayout: ForceDirectedLayout<DiviAggregatedHospital>;
  private visible: boolean = false;

  constructor(
    name: string,
    private granularity: string,
    private data: DiviAggregatedHospital[],
    private tooltipService: TooltipService,
    private colormapService: ColormapService,
    private hospitallayerService: HospitallayerService,
    private glyphOptions: Observable<BedGlyphOptions>
) {
    super(name, null);

    this.forceLayout = new ForceDirectedLayout(this.data, this.updateGlyphPositions.bind(this));

    this.glyphOptions.subscribe(opt => {
      if(!this.gHospitals || !opt) {
        return;
      }

      this.gHospitals
        .selectAll(`.bed.${BedType.icuLow}`)
        .style('opacity', opt.showIcuLow ? '1' : '0');

      this.gHospitals
        .selectAll(`.bed.${BedType.icuHigh}`)
        .style('opacity', opt.showIcuHigh ? '1' : '0');

      this.gHospitals
        .selectAll(`.bed.${BedType.ecmo}`)
        .style('opacity', opt.showEcmo ? '1' : '0');
    });
  }

  private glyphSize = {
    width: 38,
    height: 28
  };

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }

  // TODO adapt
  private getIcuLowScore(d: DiviAggregatedHospital) {
    const v = getLatest(d.icu_low_care_frei) || 0;
    const b = getLatest(d.icu_low_care_belegt) || 0;
    const a = getLatest(d.icu_low_care_einschaetzung)  || 0;

    return (b * 2 + a * 3) / (v + b + a);
  }


  // TODO adapt
  private getIcuHighScore(d: DiviAggregatedHospital) {
    const v = getLatest(d.icu_low_care_frei) || 0;
    const b = getLatest(d.icu_low_care_belegt) || 0;
    const a = getLatest(d.icu_low_care_einschaetzung)  || 0;

    return (b * 2 + a * 3) / (v + b + a);
  }

  // TODO adapt
  private getEcmoScore(d: DiviAggregatedHospital) {
    const v = getLatest(d.icu_low_care_frei) || 0;
    const b = getLatest(d.icu_low_care_belegt) || 0;
    const a = getLatest(d.icu_low_care_einschaetzung)  || 0;

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
    const yOffset = 2;

    const range = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

    const icu_low_scores = this.data.map(d => this.getIcuLowScore(d));
    const icu_low_normalizer = d3.scaleQuantize()
      .domain([0, d3.max(icu_low_scores)])
      .range(range);

    const icu_high_scores = this.data.map(d => this.getIcuHighScore(d));
    const icu_high_normalizer = d3.scaleQuantize()
      .domain([0, d3.max(icu_high_scores)])
      .range(range);

    const ecmo_scores = this.data.map(d => this.getEcmoScore(d));
    const ecmo_normalizer = d3.scaleQuantize()
      .domain([0, d3.max(ecmo_scores)])
      .range(range);

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
        d.x = p.x;
        d.y = p.y;
        d._x = p.x;
        d._y = p.y;
        return `translate(${p.x - ((3 * rectSize + padding * 3) / 2)}, ${p.y - (22 / 2)})`;
      })
      .on('mouseenter touchstart', function (d1: DiviAggregatedHospital) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(AggregatedGlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        t.diviAggregatedHospital = d1;
        d3.select(this).raise();
      })
      .on('mouseleave touchend', () => this.tooltipService.close());
      // .on('mouseenter', d1 => {
      //   const evt: MouseEvent = d3.event;
      //   const t = this.tooltipService.openAtElementRef(GlyphTooltipComponent, { x: evt.clientX, y: evt.clientY });
      //   t.name = d1.Name;
      // })
      // .on('mouseout', () => this.tooltipService.close());

    // adds white shadow
    this.gHospitals
      .append('text')
      .text(d1 => {
        return d1.Name;
      })
      .attr('x', (padding + 3 * rectSize + 4 * padding) / 2)
      .attr('y', '22')
      .attr('font-size', '8px')
      .style('text-anchor', 'middle')
      .style('stroke', 'white')
      .style('stroke-width', '4px')
      .style('opacity', '0.8');

    this.gHospitals
      .append('text')
      .text(d1 => d1.Name)
      .attr('x', (padding + 3 * rectSize + 4 * padding) / 2)
      .style('text-anchor', 'middle')
      .attr('y', '22')
      .attr('font-size', '8px');

    const self = this;
    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuLow}`)
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', padding)
      .attr('y', yOffset)
      .style('fill', d1 => this.colormapService.getBedStatusColor( {free: d1.icu_low_care_frei, full: d1.icu_low_care_belegt, prognosis: d1.icu_low_care_einschaetzung, in24h: d1.icu_low_care_in_24h }));

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuHigh}`)
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${rectSize + padding * 2}px`)
      .style('fill', d1 => this.colormapService.getBedStatusColor({free: d1.icu_high_care_frei, full: d1.icu_high_care_belegt, prognosis: d1.icu_high_care_einschaetzung, in24h:d1.icu_high_care_in_24h}));

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.ecmo}`)
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${2 * rectSize + padding * 3}px`)
      .style('fill', d1 => this.colormapService.getBedStatusColor({free: d1.icu_ecmo_care_frei, full: d1.icu_ecmo_care_belegt, prognosis: d1.icu_ecmo_care_einschaetzung, in24h: d1.icu_ecmo_care_in_24h}));

    this.onZoomed();

    return L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
      bubblingMouseEvents: true,
      zIndex: 3
    });
  }

  updateGlyphPositions() {
    this.gHospitals
      .transition().duration(100)
      .attr('transform', (d, i) => {
        return `translate(${d.x},${d.y})`;
      });
  }

  onZoomed() {
    const zoom = this.map.getZoom();
    let level = 9;
    if (this.granularity === 'regierungsbezirke') {
      level = 11;
    } else if (this.granularity === 'bundeslander') {
      level = 12;
    }
    const scale = Math.pow(level / (zoom), 3);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(500)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });

    if (!this.visible) {
      return;
    }

    const glyphBoxes = [[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]];
    this.forceLayout.update(glyphBoxes, zoom);
  }

  setVisibility(v: boolean) {
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }
}

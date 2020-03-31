import * as L from 'leaflet';
import * as d3 from 'd3';
import {Overlay} from './overlay';
import {TooltipService} from '../../services/tooltip.service';
import {FeatureCollection, MultiPolygon, Feature} from "geojson";
import {Observable} from "rxjs";
import {BedGlyphOptions} from '../options/bed-glyph-options';
import {BedType} from '../options/bed-type.enum';
import {ForceDirectedLayout} from 'src/app/util/forceDirectedLayout';
import {GlyphLayer} from "./GlyphLayer";
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { MatDialog } from '@angular/material/dialog';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';

export class AggregatedGlyphLayer extends Overlay<FeatureCollection> implements GlyphLayer {

  private gHospitals: d3.Selection<SVGGElement, Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private map: L.Map;
  private labelLayout;

  private forceLayout: ForceDirectedLayout;
  private visible: boolean = false;

  constructor(
    name: string,
    private granularity: string,
    private data: FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>,
    private tooltipService: TooltipService,
    private colormapService: QualitativeColormapService,
    private glyphOptions: Observable<BedGlyphOptions>,
    private dialog: MatDialog
) {
    super(name, data);
    console.log(name, data);

    this.forceLayout = new ForceDirectedLayout(this.data as any, this.updateGlyphPositions.bind(this));

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
  // private getIcuLowScore(d: DiviAggregatedHospital) {
  //   const v = getLatest(d.icu_low_care_frei) || 0;
  //   const b = getLatest(d.icu_low_care_belegt) || 0;
  //   const a = getLatest(d.icu_low_care_einschaetzung)  || 0;

  //   return (b * 2 + a * 3) / (v + b + a);
  // }


  // // TODO adapt
  // private getIcuHighScore(d: DiviAggregatedHospital) {
  //   const v = getLatest(d.icu_low_care_frei) || 0;
  //   const b = getLatest(d.icu_low_care_belegt) || 0;
  //   const a = getLatest(d.icu_low_care_einschaetzung)  || 0;

  //   return (b * 2 + a * 3) / (v + b + a);
  // }

  // // TODO adapt
  // private getEcmoScore(d: DiviAggregatedHospital) {
  //   const v = getLatest(d.icu_low_care_frei) || 0;
  //   const b = getLatest(d.icu_low_care_belegt) || 0;
  //   const a = getLatest(d.icu_low_care_einschaetzung)  || 0;

  //   return (b * 2 + a * 3) / (v + b + a);
  // }

  createOverlay(map: L.Map) {
    this.map = map;

    this.map.on('zoom', () => this.onZoomed());

    const latExtent = d3.extent(this.data.features, i => {
      return i.properties.centroid.coordinates[1]
    });
    const lngExtent = d3.extent(this.data.features, i => i.properties.centroid.coordinates[0]);

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

    this.gHospitals = d3.select(svgElement)
      .style("pointer-events", "none")
      .selectAll('g.hospital')
      .data(this.data.features)
      .enter()
      .append<SVGGElement>('g')
      .style("pointer-events", "all")
      .attr('class', 'hospital')
      .attr('transform', d => {
        const p = this.latLngPoint({ lat: d.properties.centroid.coordinates[1], lng: d.properties.centroid.coordinates[0] });
        d.properties.x = p.x;
        d.properties.y = p.y;
        d.properties._x = p.x;
        d.properties._y = p.y;
        return `translate(${p.x - ((3 * rectSize + padding * 3) / 2)}, ${p.y - (22 / 2)})`;
      })
      .on('mouseenter touchstart', function (d1) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        t.tooltipData = d1.properties;
        d3.select(this).raise();
      })
      .on('mouseleave touchend', () => this.tooltipService.close())
      .on('click', d => {
        this.dialog.open(HospitalInfoDialogComponent, {
          data: d.properties
        });
      });
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
        return d1.properties.name;
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
      .text(d1 => d1.properties.name)
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
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuLow));

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuHigh}`)
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${rectSize + padding * 2}px`)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuHigh));

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.ecmo}`)
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${2 * rectSize + padding * 3}px`)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.ecmo));

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
        return `translate(${d.properties.x},${d.properties.y})`;
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

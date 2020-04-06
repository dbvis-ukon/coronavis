import { MatDialog } from '@angular/material/dialog';
import * as d3 from 'd3';
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import * as L from 'leaflet';
import { Observable } from "rxjs";
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { TooltipService } from '../../services/tooltip.service';
import { AggregationLevel } from "../options/aggregation-level.enum";
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { GlyphLayer } from "./GlyphLayer";
import { Overlay } from './overlay';

export class AggregatedGlyphLayer extends Overlay<FeatureCollection> implements GlyphLayer {

  private gHospitals: d3.Selection<SVGGElement, Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private map: L.Map;
  private labelLayout;

  private forceLayout: ForceDirectedLayout;
  private visible: boolean = false;

  constructor(
    name: string,
    private granularity: AggregationLevel,
    private data: FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>,
    private tooltipService: TooltipService,
    private colormapService: QualitativeColormapService,
    private forceDirect: boolean,
    private glyphOptions: Observable<BedGlyphOptions>,
    private dialog: MatDialog
) {
    super(name, data);

    if (this.forceDirect) {
      this.forceLayout = new ForceDirectedLayout(this.data as any, granularity, this.updateGlyphPositions.bind(this));
    }

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

  private rectSize = 10;
  private glyphSize = {
    width: 38,
    height: 28
  };

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }

  createOverlay(map: L.Map) {
    const data = this.data.features;

    this.map = map;

    this.map.on('zoom', () => this.onZoomed());

    const latExtent = d3.extent(this.data.features, i => {
      if (i.properties.centroid.coordinates[1] !== 0) {
        return i.properties.centroid.coordinates[1];
      }
      return NaN;
    });
    const lngExtent = d3.extent(this.data.features, i => {
      if (i.properties.centroid.coordinates[0] !== 0) {
        return i.properties.centroid.coordinates[0];
      }
      return NaN;
    });

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


    const padding = 2;
    const yOffset = 2;

    this.gHospitals = d3.select(svgElement)
      .style('pointer-events', 'none')
      .selectAll('g.hospital')
      .data(data)
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
        return `translate(${p.x - ((3 * this.rectSize + padding * 3) / 2)}, ${p.y - (22 / 2)})`;
      });

    const container = this.gHospitals
      .append("g")
      .attr("class", "container")
      .on('mouseenter', (d1, i, n) => {
        const currentElement = n[i];
        const evt: MouseEvent = d3.event;
        const t = this.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX + 5, y: evt.clientY + 5});
        t.tooltipData = d1.properties;
        d3.select(currentElement).raise();
      })
      .on('mouseleave', () => this.tooltipService.close())
      .on('click', d => {
        this.tooltipService.close();
        this.dialog.open(HospitalInfoDialogComponent, {
          data: d.properties
        });
      });

    container
      .append('rect')
      .attr('class', 'background-rect')
      .attr('width', this.glyphSize.width)
      .attr('height', this.glyphSize.height / 2);

    container
      .append('text')
      .attr('class', 'text-bg aggName')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '22');


    container
      .append('text')
      .attr('class', 'text-fg aggName')
      .text(d1 => d1.properties.name)
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '22');


    container
      .append('rect')
      .attr('class', `bed ${BedType.icuLow}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', padding)
      .attr('y', yOffset)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuLow));

    container
      .append('rect')
      .attr('class', `bed ${BedType.icuHigh}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${this.rectSize + padding * 2}px`)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuHigh));

    container
      .append('rect')
      .attr('class', `bed ${BedType.ecmo}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${2 * this.rectSize + padding * 3}px`)
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
      .transition().duration(500)
      .attr('transform', (d, i) => {
        return `translate(${d.properties.x},${d.properties.y})`;
      });
  }

  onZoomed() {
    const zoom = this.map.getZoom();

    let level = 9;
    if (this.granularity === AggregationLevel.governmentDistrict) {
      level = 11;
    } else if (this.granularity === AggregationLevel.state) {
      level = 12;
    }
    
    const scale = Math.pow(level / (zoom), 3);

    this.gHospitals
      .selectAll('g.container')
      .transition()
      .duration(500)
      .attr('transform', () => {
        return `scale(${scale}, ${scale})`;
      });

    if (!this.visible) {
      return;
    }

    if (this.forceDirect) {
      const glyphBoxes = [[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]];
      this.forceLayout.update(glyphBoxes, zoom);
    }
  }

  setVisibility(v: boolean) {
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }
}

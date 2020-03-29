import * as L from 'leaflet';
import * as d3 from 'd3';
import {Overlay} from './overlay';
import {TooltipService} from 'src/app/services/tooltip.service';
import {GlyphTooltipComponent} from 'src/app/glyph-tooltip/glyph-tooltip.component';
import {Feature, FeatureCollection, Point} from "geojson";
import {Observable} from 'rxjs';
import {BedGlyphOptions} from '../options/bed-glyph-options';
import {BedType} from '../options/bed-type.enum';
import {MatDialog} from '@angular/material/dialog';
import {HospitalInfoDialogComponent} from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import {ForceDirectedLayout} from 'src/app/util/forceDirectedLayout';
import {GlyphLayer} from "./GlyphLayer";
import {SingleHospitalOut} from 'src/app/repositories/types/out/single-hospital-out';
import {QualitativeTimedStatus} from 'src/app/repositories/types/in/qualitative-hospitals-development';
import {QualitativeColormapService} from 'src/app/services/qualitative-colormap.service';
import {AggregationLevel} from "../options/aggregation-level.enum";

export class SimpleGlyphLayer extends Overlay<FeatureCollection> implements GlyphLayer {

  private gHospitals: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private nameHospitals: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private cityHospitals: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private nameHospitalsShadow: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private cityHospitalsShadow: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private map: L.Map;

  private visible: boolean = false;

  private forceLayout: ForceDirectedLayout;

  private currentScale: number = 1;

  constructor(
    name: string,
    private data: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>,
    private tooltipService: TooltipService,
    private colormapService: QualitativeColormapService,
    private glyphOptions: Observable<BedGlyphOptions>,
    private dialog: MatDialog
  ) {
    super(name, data);
    this.enableDefault = true;

    this.forceLayout = new ForceDirectedLayout(this.data, AggregationLevel.none, this.updateGlyphPositions.bind(this));

    this.glyphOptions.subscribe(opt => {
      if (!this.gHospitals || !opt) {
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

  // Some cities have double names. These are the first parts
  private doubleNames = new Set(['Sankt', 'St.', 'Bergisch', 'Königs', 'Lutherstadt', 'Schwäbisch']);
  // Regexes for cleaning city names
  private rxAdr = /.*\d{4,5} /;
  private rxBad = /^Bad /;
  private rxSlash = /\/.*/;
  private rxDash = /-([A-Z])[a-zäöü]{6,}/;
  private currentHoverLine;

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }
  // Extract the city name from the address and shorten
  private shorten_city_name(address) {
    if (!address) {
      return '';
    }
    const nameParts = address.replace(this.rxAdr, '') // Remove address
        .replace(this.rxBad, '') // Remove 'Bad'
        .replace(this.rxSlash, '') // Remove additional descriptions
        .replace(this.rxDash, '-$1.') // Initials for second of double names
        .split(' ');
    return this.doubleNames.has(nameParts[0]) ? nameParts.slice(0, 2).join(' ') : nameParts[0];
  }

  createOverlay(map: L.Map) {
    this.map = map;

    this.map.on('zoom', (d) => {
      this.onZoomed();
    });


    const latExtent = d3.extent(this.data.features, i => {
      if (i.geometry.coordinates[1] !== 0) {
        return i.geometry.coordinates[1];
      }
      return NaN;
    });
    const lngExtent = d3.extent(this.data.features, i => {
      if (i.geometry.coordinates[0] !== 0) {
        return i.geometry.coordinates[0]
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

    // svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);


    const self = this;

    const padding = 2;
    const yOffset = 2;

    this.gHospitals = d3.select<SVGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(svgElement)
      .style('pointer-events', 'none')
      .selectAll<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>('g.hospital')
      .data<Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(this.data.features)
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'hospital')
      .attr('transform', d => {
        const p = this.latLngPoint({ lat: d.geometry.coordinates[1], lng: d.geometry.coordinates[0]});
        d.properties.x = p.x;
        d.properties.y = p.y;
        d.properties._x = p.x;
        d.properties._y = p.y;
        return `translate(${p.x}, ${p.y})`;
      })
      .on('mouseenter', (d1, i, n) => {
        const currentElement = n[i];
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX + 5, y: evt.clientY + 5});
        t.tooltipData = d1.properties;
        d3.select(currentElement).raise();

        this.currentHoverLine = d3.select(currentElement)
        .append<SVGLineElement>("line")
        .attr('class', 'pointer-line')
        //.firstChild.insert<SVGLineElement>("line", )
        .attr("x1", 1) //`translate(${d1.properties.x})` d1.geometry.coordinates[1]
        .attr("y1", 1)
        .attr("x2", d1.properties._x-d1.properties.x)
        .attr("y2", d1.properties._y-d1.properties.y)
        .lower();

        d3.select(currentElement)
        .selectAll("*:not(.pointer-line)")
        .raise();
      })
      .on('mouseleave', () => {
        this.tooltipService.close();
        this.currentHoverLine.remove();
      })
      .on('click', d => this.openDialog(d.properties));
    
    this.gHospitals
      .append('rect')
      .attr('class', 'background-rect')
      .attr('width', this.glyphSize.width)
      .attr('height', this.glyphSize.height / 2);

    this.nameHospitalsShadow = this.gHospitals
      .append('text')
      .attr('class', 'text-bg hospital')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '13')
      .call(this.wrap, '50');

    this.nameHospitals = this.gHospitals
      .append('text')
      .attr('class', 'text-fg hospital')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '13')
      .call(this.wrap, '50');


    this.cityHospitalsShadow = this.gHospitals
      .append('text')
      .attr('class', 'text-bg city hiddenLabel')
      .text(d1 => this.shorten_city_name(d1.properties.address))
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '22');

    this.cityHospitals = this.gHospitals
      .append('text')
      .attr('class', 'text-fg city hiddenLabel')
      .text(d1 => this.shorten_city_name(d1.properties.address))
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '22');

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuLow}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      // .style('fill', d1 => colorScale(getLatest(d1.icu_low_care_frei))) // todo colorScale(d1.icuLowCare))
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuLow))
      .attr('x', padding)
      .attr('y', yOffset);

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuHigh}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', `${this.rectSize}px`)
      // .style('fill', d1 => colorScale(getLatest(d1.icu_high_care_frei))) // todo colorScale(d1.icuHighCare))
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuHigh))
      .attr('y', yOffset)
      .attr('x', `${this.rectSize + padding * 2}px`);

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.ecmo}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', `${2 * this.rectSize}px`)
      // .style('fill', d1 => colorScale(getLatest(d1.icu_ecmo_care_frei)))// todo colorScale(d1.ECMO))
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.ecmo))
      .attr('y', yOffset)
      .attr('x', `${2 * this.rectSize + padding * 3}px`);

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
    const scale = Math.pow(9 / (zoom), 4);
    this.currentScale = scale;

    // Resize glyph bounding boxes + show/hide labels
    if (this.map.getZoom() >= 9) {
      // this.glyphSize.height = 40;
      // this.glyphSize.width = 80;

      this.cityHospitals.classed('hiddenLabel', true);
      this.cityHospitalsShadow.classed('hiddenLabel', true);

      this.nameHospitals.classed('hiddenLabel', false);
      this.nameHospitalsShadow.classed('hiddenLabel', false);
    } else if (this.map.getZoom() === 8) {
      // this.glyphSize.height = 28;
      // this.glyphSize.width = 38;

      this.cityHospitals.classed('hiddenLabel', false);
      this.cityHospitalsShadow.classed('hiddenLabel', false);

      this.nameHospitals.classed('hiddenLabel', true);
      this.nameHospitalsShadow.classed('hiddenLabel', true);
    } else if (this.map.getZoom() === 7) {
      // this.glyphSize.height = 14;
      // this.glyphSize.width = 38;

      this.cityHospitals.classed('hiddenLabel', true);
      this.cityHospitalsShadow.classed('hiddenLabel', true);
      this.nameHospitals.classed('hiddenLabel', true);
      this.nameHospitalsShadow.classed('hiddenLabel', true);
    }

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(100)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });

    if (!this.visible) {
      return;
    }

    const glyphBoxes = [[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]];
    this.forceLayout.update(glyphBoxes, zoom);
  }

  wrap(text, width) {
    text.each(function() {
      let text = d3.select(this),
        words = text.text().split(' ').reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        x = text.attr('x'),
        y = text.attr('y'),
        dy = 1.1,
        tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.text().length > 25) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
        }
      }
    });
  }

  private openDialog(data: SingleHospitalOut<QualitativeTimedStatus>): void {
    this.dialog.open(HospitalInfoDialogComponent, {
      data
    });
  }

  setVisibility(v: boolean) {
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }
}

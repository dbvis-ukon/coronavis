import { MatDialog } from '@angular/material/dialog';
import * as d3 from 'd3';
import { Feature, FeatureCollection, Point } from "geojson";
import * as L from 'leaflet';
import { Observable } from 'rxjs';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { AggregationLevel } from "../options/aggregation-level.enum";
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { GlyphLayer } from "./GlyphLayer";
import { Overlay } from './overlay';

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
    private forceEnabled: boolean,
    private glyphOptions: Observable<BedGlyphOptions>,
    private dialog: MatDialog
  ) {
    super(name, data);
    this.enableDefault = true;

    if (forceEnabled) {
      this.forceLayout = new ForceDirectedLayout(this.data, AggregationLevel.none, this.updateGlyphPositions.bind(this));
    }

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
    const data = this.data.features;

    this.map = map;

    this.map.on('zoom', () => this.onZoomed());

    const latExtent = d3.extent(data, i => {
      if (i.geometry.coordinates[1] !== 0) {
        return i.geometry.coordinates[1];
      }
      return NaN;
    });
    const lngExtent = d3.extent(data, i => {
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

    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);


    const padding = 0.5;
    const yOffset = 0.5;

    this.gHospitals = d3.select<SVGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(svgElement)
      .style('pointer-events', 'none')
      .selectAll<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>('g.hospital')
      .data<Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>>(data)
      .enter()
      .append<SVGGElement>('g')
      .style("pointer-events", "all")
      .attr('class', 'hospital')
      .attr('transform', d => {
        const p = this.latLngPoint({ lat: d.geometry.coordinates[1], lng: d.geometry.coordinates[0]});
        d.properties.x = p.x;
        d.properties.y = p.y;
        d.properties._x = p.x;
        d.properties._y = p.y;
        return `translate(${p.x}, ${p.y})`;
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
        if(this.currentHoverLine) {
          this.currentHoverLine.remove();
        }
      })
      .on('click', d => {
        this.dialog.open(HospitalInfoDialogComponent, {
          data: d.properties
        });
      });

    container
      .append('rect')
      .attr('class', 'background-rect')
      .attr('width', this.glyphSize.width)
      .attr('height', this.glyphSize.height / 2);

    this.nameHospitalsShadow = container
      .append('text')
      .attr('class', 'text-bg hospital')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '13')
      .call(this.wrap, '50');

    this.nameHospitals = container
      .append('text')
      .attr('class', 'text-fg hospital')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '13')
      .call(this.wrap, '50');


    this.cityHospitalsShadow = container
      .append('text')
      .attr('class', 'text-bg city hiddenLabel')
      .text(d1 => this.shorten_city_name(d1.properties.address))
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '22');

    this.cityHospitals = container
      .append('text')
      .attr('class', 'text-fg city hiddenLabel')
      .text(d1 => this.shorten_city_name(d1.properties.address))
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

    let scale = Math.pow(9 / (zoom), 4);

    // decrease size further for low zoom levels (country wide overview)
    if (zoom < 8) {
      scale = scale / (Math.pow(1.4, (8 - zoom)));
    }
    // decrease size further for high zoom levels (city districts)
    if (zoom > 12) {
      scale = scale / (Math.pow(1.5, (zoom - 12)));
    }
    this.currentScale = scale;

    this.glyphSize.width = 40;
    this.glyphSize.height = 28;

    // hidden by default
    this.cityHospitals.classed('hiddenLabel', true);
    this.cityHospitalsShadow.classed('hiddenLabel', true);
    this.nameHospitals.classed('hiddenLabel', true);
    this.nameHospitalsShadow.classed('hiddenLabel', true);


    // Resize glyph bounding boxes + show/hide labels
    if (this.map.getZoom() >= 12) {
      this.glyphSize.width = 30;
      this.glyphSize.height = 10;
      this.nameHospitals.classed('hiddenLabel', false);
      this.nameHospitalsShadow.classed('hiddenLabel', false);

      // true, true
    } else if (this.map.getZoom() === 11) {
      this.glyphSize.width = 30;
      this.glyphSize.height = 10;
      this.cityHospitals.classed('hiddenLabel', false);
      this.cityHospitalsShadow.classed('hiddenLabel', false);

      // true, true
    } else if (this.map.getZoom() === 10) {
      this.glyphSize.width = 30;
      this.glyphSize.height = 10;

      // true, true
    } else if (this.map.getZoom() === 9) {
      this.glyphSize.width = 30;
      this.glyphSize.height = 10;

      // true, false
    } else if (this.map.getZoom() === 8) {
      this.glyphSize.width = 30;
      this.glyphSize.height = 10;

      // false, true
    } else if (this.map.getZoom() <= 7) {
      this.glyphSize.width = 30;
      this.glyphSize.height = 10;
      // true, true
    }

    this.gHospitals
      .selectAll('g.container')
      .transition()
      .duration(100)
      .attr('transform', () => {
        return `scale(${scale}, ${scale})`;
      });

    if (!this.visible) {
      return;
    }

    if (this.forceEnabled) {
      const glyphBoxes = [[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]];
      this.forceLayout.update(glyphBoxes, zoom);
    }
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

  setVisibility(v: boolean) {
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }
}

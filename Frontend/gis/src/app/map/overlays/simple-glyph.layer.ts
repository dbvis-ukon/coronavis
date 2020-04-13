import { MatDialog } from '@angular/material/dialog';
import { select } from 'd3-selection';
import { Feature, FeatureCollection, Point } from "geojson";
import { LocalStorageService } from 'ngx-webstorage';
import { Observable } from 'rxjs';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { AggregationLevel } from "../options/aggregation-level.enum";
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { AbstractGlyphLayer } from './abstract-glyph.layer';
import { GlyphLayer } from "./GlyphLayer";

export class SimpleGlyphLayer extends AbstractGlyphLayer<Point, SingleHospitalOut<QualitativeTimedStatus>> implements GlyphLayer {
  

  private nameHospitals: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private cityHospitals: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private nameHospitalsShadow: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;
  private cityHospitalsShadow: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGElement, unknown>;

  // Some cities have double names. These are the first parts
  private doubleNames = new Set(['Sankt', 'St.', 'Bergisch', 'Königs', 'Lutherstadt', 'Schwäbisch']);
  // Regexes for cleaning city names
  private rxAdr = /.*\d{4,5} /;
  private rxBad = /^Bad /;
  private rxSlash = /\/.*/;
  private rxDash = /-([A-Z])[a-zäöü]{6,}/;
  private currentHoverLine;


  constructor(
    name: string,
    data: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>,
    tooltipService: TooltipService,
    colormapService: QualitativeColormapService,
    forceEnabled: boolean,
    glyphOptions: Observable<BedGlyphOptions>,
    dialog: MatDialog,
    storage: LocalStorageService
  ) {
    super(name, data, AggregationLevel.none, tooltipService, colormapService, forceEnabled, glyphOptions, dialog, storage);
  }

  latAcc(d: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>): number {
    return d.geometry.coordinates[1];
  }

  lngAcc(d: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>): number {
    return d.geometry.coordinates[0];
  }
  
  appendText(container: d3.Selection<SVGGElement, Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, SVGSVGElement, unknown>) {
    this.nameHospitalsShadow = container
      .append('text')
      .attr('class', 'text-bg hospital')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (this.rectPadding + 3 * this.rectSize + 4 * this.rectPadding) / 2)
      .attr('y', '13')
      .call(this.wrap, '50');

    this.nameHospitals = container
      .append('text')
      .attr('class', 'text-fg hospital')
      .text(d1 => {
        return d1.properties.name;
      })
      .attr('x', (this.rectPadding + 3 * this.rectSize + 4 * this.rectPadding) / 2)
      .attr('y', '13')
      .call(this.wrap, '50');


    this.cityHospitalsShadow = container
      .append('text')
      .attr('class', 'text-bg city hiddenLabel')
      .text(d1 => this.shorten_city_name(d1.properties.address))
      .attr('x', (this.rectPadding + 3 * this.rectSize + 4 * this.rectPadding) / 2)
      .attr('y', '22');

    this.cityHospitals = container
      .append('text')
      .attr('class', 'text-fg city hiddenLabel')
      .text(d1 => this.shorten_city_name(d1.properties.address))
      .attr('x', (this.rectPadding + 3 * this.rectSize + 4 * this.rectPadding) / 2)
      .attr('y', '22');
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

  onMouseEnter(d: Feature <Point, SingleHospitalOut<QualitativeTimedStatus>> , i: number, n: SVGElement[] | ArrayLike < SVGElement > ): SVGElement {
    const currentElement = super.onMouseEnter(d, i, n);

    this.currentHoverLine = select(currentElement)
        .append<SVGLineElement>("line")
        .attr('class', 'pointer-line')
        //.firstChild.insert<SVGLineElement>("line", )
        .attr("x1", 1) //`translate(${d1.properties.x})` d1.geometry.coordinates[1]
        .attr("y1", 1)
        .attr("x2", d.properties._x - d.properties.x)
        .attr("y2", d.properties._y - d.properties.y)
        .lower();

      select(currentElement)
        .selectAll("*:not(.pointer-line)")
        .raise();

      return currentElement;
  }

  onMouseLeave(): void {
    super.onMouseLeave();

    if(this.currentHoverLine) {
      this.currentHoverLine.remove();
    }
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
      let text = select(this),
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
}

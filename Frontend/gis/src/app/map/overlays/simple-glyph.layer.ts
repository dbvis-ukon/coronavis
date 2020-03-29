import * as L from 'leaflet';
import * as d3 from 'd3';
import {Overlay} from './overlay';
import {TooltipService} from 'src/app/services/tooltip.service';
import {GlyphTooltipComponent} from 'src/app/glyph-tooltip/glyph-tooltip.component';
import {DiviHospital, getLatest} from 'src/app/services/divi-hospitals.service';
import {ColormapService} from 'src/app/services/colormap.service';
import {FeatureCollection} from 'geojson';
import {quadtree} from 'd3';
import { Observable } from 'rxjs';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { MatDialog } from '@angular/material/dialog';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';

export class SimpleGlyphLayer extends Overlay<FeatureCollection> {

  constructor(
    name: string,
    private data: DiviHospital[],
    private tooltipService: TooltipService,
    private colormapService: ColormapService,
    private glyphOptions: Observable<BedGlyphOptions>,
    private dialog: MatDialog
  ) {
    super(name, null);
    this.enableDefault = true;


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

  private gHospitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private nameHospitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private cityHospitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private nameHospitalsShadow: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private cityHospitalsShadow: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private map: L.Map;


  private lastTransform;

  private labelLayout;

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

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }
  // Extract the city name from the address and shorten
  private shorten_city_name(address) {
    if (address === null) {
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

    // svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);


    const colorScale = this.colormapService.getSingleHospitalColormapStates();

    const self = this;

    const padding = 2;
    const yOffset = 2;

    this.gHospitals = d3.select(svgElement)
      .style('pointer-events', 'none')
      .selectAll('g.hospital')
      .data<DiviHospital>(this.data)
      .enter()
      .append<SVGGElement>('g')
      .style('pointer-events', 'all')
      .attr('class', 'hospital')
      .attr('transform', d => {
        const p = this.latLngPoint(d.Location);
        d.x = p.x;
        d.y = p.y;
        d._x = p.x;
        d._y = p.y;
        return `translate(${p.x}, ${p.y})`;
      })
      .on('mouseenter', function(d1: DiviHospital) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        t.diviHospital = d1;
        d3.select(this).raise();
      })
      .on('mouseleave', () => this.tooltipService.close())
      .on('click', d => this.openDialog(d));

    // this.gHospitals
    //   .append('rect')
    //   .attr('width', this.glyphSize.width)
    //   .attr('height', this.glyphSize.height/2)
    //   .attr('fill', 'white')
    //   .attr('stroke', '#cccccc');

    this.nameHospitalsShadow = this.gHospitals
      .append('text')
      .text(d1 => {
        return d1.Name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '13')
      .attr('font-size', '7px')
      .style('text-anchor', 'middle')
      .style('stroke', 'white')
      .style('stroke-width', '4px')
      .style('opacity', '0.8')
      .call(this.wrap, '50');

    this.nameHospitals = this.gHospitals
      .append('text')
      .text(d1 => {
        return d1.Name;
      })
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .attr('y', '13')
      .attr('font-size', '7px')
      .style('text-anchor', 'middle')
      .call(this.wrap, '50');


    this.cityHospitalsShadow = this.gHospitals
      .append('text')
      .text(d1 => this.shorten_city_name(d1.Address))
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .style('text-anchor', 'middle')
      .attr('y', '22')
      .attr('font-size', '10px')
      .style('text-anchor', 'middle')
      .style('stroke', 'white')
      .style('stroke-width', '4px')
      .style('opacity', '0.8')
      .classed('hiddenLabel', true);

    this.cityHospitals = this.gHospitals
      .append('text')
      .text(d1 => this.shorten_city_name(d1.Address))
      .attr('x', (padding + 3 * this.rectSize + 4 * padding) / 2)
      .style('text-anchor', 'middle')
      .attr('y', '22')
      .attr('font-size', '10px')
      .classed('hiddenLabel', true);

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuLow}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      // .style('fill', d1 => colorScale(getLatest(d1.icu_low_care_frei))) // todo colorScale(d1.icuLowCare))
      .style('fill', d1 => this.colormapService.getBedStatusColor(d1.icu_low_summary))
      .attr('x', padding)
      .attr('y', yOffset);

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.icuHigh}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', `${this.rectSize}px`)
      // .style('fill', d1 => colorScale(getLatest(d1.icu_high_care_frei))) // todo colorScale(d1.icuHighCare))
      .style('fill', d1 => this.colormapService.getBedStatusColor(d1.icu_high_summary))
      .attr('y', yOffset)
      .attr('x', `${this.rectSize + padding * 2}px`);

    this.gHospitals
      .append('rect')
      .attr('class', `bed ${BedType.ecmo}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', `${2 * this.rectSize}px`)
      // .style('fill', d1 => colorScale(getLatest(d1.icu_ecmo_care_frei)))// todo colorScale(d1.ECMO))
      .style('fill', d1 => this.colormapService.getBedStatusColor(d1.icu_ecmo_summary))
      .attr('y', yOffset)
      .attr('x', `${2 * this.rectSize + padding * 3}px`);

    this.onZoomed();

    return L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
      bubblingMouseEvents: true,
      zIndex: 3
    });
  }

  startForceSimulation(glyphSizes): d3.Simulation<any, undefined> {
    return d3.forceSimulation(this.data)
      .alpha(0.1)
      .force('collide', this.quadtreeCollide(glyphSizes))
      .on('end', () => this.ticked());
  }

  ticked() {
    this.gHospitals
      .transition().duration(100)
      .attr('transform', (d, i) => {
        return `translate(${d.x},${d.y})`;
      });
  }

  onZoomed() {
    const zoom = this.map.getZoom();
    const scale = Math.pow(9 / (zoom), 4);

    if (this.map.getZoom() > 8) {
      this.glyphSize.height = 40;
      this.glyphSize.width = 80;

      this.cityHospitals.classed('hiddenLabel', true);
      this.cityHospitalsShadow.classed('hiddenLabel', true);

      this.nameHospitals.classed('hiddenLabel', false);
      this.nameHospitalsShadow.classed('hiddenLabel', false);
    } else if (this.map.getZoom() < 9 && this.map.getZoom() > 6) {
      this.glyphSize.height = 28;
      this.glyphSize.width = 38;

      this.cityHospitals.classed('hiddenLabel', false);
      this.cityHospitalsShadow.classed('hiddenLabel', false);

      this.nameHospitals.classed('hiddenLabel', true);
      this.nameHospitalsShadow.classed('hiddenLabel', true);
    } else if (this.map.getZoom() < 7) {
      this.glyphSize.height = 14;
      this.glyphSize.width = 38;

      this.cityHospitals.classed('hiddenLabel', true);
      this.cityHospitalsShadow.classed('hiddenLabel', true);
      this.nameHospitals.classed('hiddenLabel', true);
      this.nameHospitalsShadow.classed('hiddenLabel', true);
    }

    this.data.forEach(d => {
      d.x = d._x;
      d.y = d._y;
    });

    if (this.labelLayout) {
      this.labelLayout.stop();
    }
    // TODO Fabian enable again, strange things are happening here
    // this.labelLayout = this.startForceSimulation([[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]]);

    // console.log('zoomed', this.map.getZoom(), scale);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(100)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });

  }

  private quadtreeCollide(bbox) {
    bbox = constant(bbox);

    let nodes;
    let boundingBoxes;
    const strength = 0.1;
    const iterations = 1;

    force.initialize = function(_) {
      let i, n = (nodes = _).length;
      boundingBoxes = new Array(n);
      for (i = 0; i < n; ++i) { boundingBoxes[i] = bbox(nodes[i], i, nodes); }
    };

    function x(d) {
      return d.x + d.vx;
    }

    function y(d) {
      return d.y + d.vy;
    }

    function constant(x: [[number, number], [number, number]]) {
      return function() {
        return x;
      };
    }


    function force() {
      let i,
        tree,
        node,
        xi,
        yi,
        bbi,
        nx1,
        ny1,
        nx2,
        ny2;

      const cornerNodes = [];
      nodes.forEach(function(d, i) {
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + (boundingBoxes[i][1][0] + boundingBoxes[i][0][0]) / 2,
          y: d.y + (boundingBoxes[i][0][1] + boundingBoxes[i][1][1]) / 2
        });
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][0][0],
          y: d.y + boundingBoxes[i][0][1]
        });
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][0][0],
          y: d.y + boundingBoxes[i][1][1]
        });
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][1][0],
          y: d.y + boundingBoxes[i][0][1]
        });
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][1][0],
          y: d.y + boundingBoxes[i][1][1]
        });
      });
      const cn = cornerNodes.length;

      for (let k = 0; k < iterations; ++k) {
        tree = quadtree(cornerNodes, x, y).visitAfter(prepareCorners);

        for (i = 0; i < cn; ++i) {
          const nodeI = ~~(i / 5);
          node = nodes[nodeI];
          bbi = boundingBoxes[nodeI];
          xi = node.x + node.vx;
          yi = node.y + node.vy;
          nx1 = xi + bbi[0][0];
          ny1 = yi + bbi[0][1];
          nx2 = xi + bbi[1][0];
          ny2 = yi + bbi[1][1];
          tree.visit(apply);
        }
      }

      function apply(quad, x0, y0, x1, y1) {
        const data = quad.data;
        if (data) {
          const bWidth = bbLength(bbi, 0),
            bHeight = bbLength(bbi, 1);

          const nodeI = 0; // TODO remove
          if (data.node.index !== nodeI) {
            const dataNode = data.node;
            const bbj = boundingBoxes[dataNode.index],
              dnx1 = dataNode.x + dataNode.vx + bbj[0][0],
              dny1 = dataNode.y + dataNode.vy + bbj[0][1],
              dnx2 = dataNode.x + dataNode.vx + bbj[1][0],
              dny2 = dataNode.y + dataNode.vy + bbj[1][1],
              dWidth = bbLength(bbj, 0),
              dHeight = bbLength(bbj, 1);

            if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {

              const xSize = [Math.min.apply(null, [dnx1, dnx2, nx1, nx2]), Math.max.apply(null, [dnx1, dnx2, nx1, nx2])];
              const ySize = [Math.min.apply(null, [dny1, dny2, ny1, ny2]), Math.max.apply(null, [dny1, dny2, ny1, ny2])];

              const xOverlap = bWidth + dWidth - (xSize[1] - xSize[0]);
              const yOverlap = bHeight + dHeight - (ySize[1] - ySize[0]);

              const xBPush = xOverlap * strength / 5 * (yOverlap / bHeight);
              const yBPush = yOverlap * strength * (xOverlap / bWidth);

              const xDPush = xOverlap * strength / 5 * (yOverlap / dHeight);
              const yDPush = yOverlap * strength * (xOverlap / dWidth);

              if ((nx1 + nx2) / 2 < (dnx1 + dnx2) / 2) {
                node.vx -= xBPush;
                dataNode.vx += xDPush;
              } else {
                node.vx += xBPush;
                dataNode.vx -= xDPush;
              }
              if ((ny1 + ny2) / 2 < (dny1 + dny2) / 2) {
                node.vy -= yBPush;
                dataNode.vy += yDPush;
              } else {
                node.vy += yBPush;
                dataNode.vy -= yDPush;
              }
            }

          }
          return;
        }

        return x0 > nx2 || x1 < nx1 || y0 > ny2 || y1 < ny1;
      }

    }

    function prepareCorners(quad) {

      if (quad.data) {
        return quad.bb = boundingBoxes[quad.data.node.index];
      }
      quad.bb = [[0, 0], [0, 0]];
      for (let i = 0; i < 4; ++i) {
        if (quad[i] && quad[i].bb[0][0] < quad.bb[0][0]) {
          quad.bb[0][0] = quad[i].bb[0][0];
        }
        if (quad[i] && quad[i].bb[0][1] < quad.bb[0][1]) {
          quad.bb[0][1] = quad[i].bb[0][1];
        }
        if (quad[i] && quad[i].bb[1][0] > quad.bb[1][0]) {
          quad.bb[1][0] = quad[i].bb[1][0];
        }
        if (quad[i] && quad[i].bb[1][1] > quad.bb[1][1]) {
          quad.bb[1][1] = quad[i].bb[1][1];
        }
      }
    }

    function bbLength(bbox, heightWidth) {
      return bbox[1][heightWidth] - bbox[0][heightWidth];
    }

    return force;
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

  private openDialog(data: DiviHospital): void {
    this.dialog.open(HospitalInfoDialogComponent, {
      data
    });
  }

}

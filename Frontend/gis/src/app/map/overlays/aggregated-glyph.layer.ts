import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import {TooltipService} from '../../services/tooltip.service';
import {DiviAggregatedHospital,
  DiviHospital,
  getLatest,
  TimestampedValue
} from 'src/app/services/divi-hospitals.service';
import { ColormapService } from 'src/app/services/colormap.service';
import {FeatureCollection} from "geojson";
import {GlyphHoverEvent} from "../events/glyphhover";
import {HospitallayerService} from "../../services/hospitallayer.service";
import {Subject, Observable} from "rxjs";
import {quadtree} from "d3";
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import {GlyphTooltipComponent} from 'src/app/glyph-tooltip/glyph-tooltip.component';
import {AggregatedGlyphTooltipComponent} from "../../aggregated-glyph-tooltip/aggregated-glyph-tooltip.component";

export class AggregatedGlyphLayer extends Overlay<FeatureCollection> {

  private gHospitals: d3.Selection<SVGGElement, DiviAggregatedHospital, SVGElement, unknown>;
  private map: L.Map;
  private labelLayout;

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

    // this.gHospitals
    //   .append('rect')
    //   .attr('width', this.glyphSize.width)
    //   .attr('height', this.glyphSize.height/2)
    //   .attr('fill', 'white')
    //   .attr('stroke', '#cccccc');

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

  startForceSimulation(glyphSizes): d3.Simulation<any, undefined> {
    return d3.forceSimulation(this.data)
      .alpha(0.1)
      .force("collide", this.quadtreeCollide(glyphSizes))
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
    let level = 9;
    if(this.granularity === 'regierungsbezirke'){
      level = 11;
    } else if (this.granularity === 'bundeslander'){
      level = 12;
    }
    const scale = Math.pow(level / (zoom), 3);

    this.data.forEach(d => {
      d.x = d._x;
      d.y = d._y;
    });

    if (this.labelLayout) {
      this.labelLayout.stop();
    }
    this.labelLayout = this.startForceSimulation([[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]]);

    // console.log('zoomed', this.map.getZoom(), scale);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(500)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });
  }

  private quadtreeCollide(bbox) {
    bbox = constant(bbox)

    let nodes;
    let boundingBoxes;
    let strength = 0.1;
    let iterations = 1;

    force.initialize = function (_) {
      var i, n = (nodes = _).length;
      boundingBoxes = new Array(n);
      for (i = 0; i < n; ++i) boundingBoxes[i] = bbox(nodes[i], i, nodes);
    };

    function x(d) {
      return d.x + d.vx;
    }

    function y(d) {
      return d.y + d.vy;
    }

    function constant(x: [[number, number], [number, number]]) {
      return function () {
        return x;
      };
    }

    function force() {
      var i,
        tree,
        node,
        xi,
        yi,
        bbi,
        nx1,
        ny1,
        nx2,
        ny2

      var cornerNodes = []
      nodes.forEach(function (d, i) {
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + (boundingBoxes[i][1][0] + boundingBoxes[i][0][0]) / 2,
          y: d.y + (boundingBoxes[i][0][1] + boundingBoxes[i][1][1]) / 2
        })
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][0][0],
          y: d.y + boundingBoxes[i][0][1]
        })
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][0][0],
          y: d.y + boundingBoxes[i][1][1]
        })
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][1][0],
          y: d.y + boundingBoxes[i][0][1]
        })
        cornerNodes.push({
          node: d,
          vx: d.vx,
          vy: d.vy,
          x: d.x + boundingBoxes[i][1][0],
          y: d.y + boundingBoxes[i][1][1]
        })
      })
      var cn = cornerNodes.length

      for (var k = 0; k < iterations; ++k) {
        tree = quadtree(cornerNodes, x, y).visitAfter(prepareCorners);

        for (i = 0; i < cn; ++i) {
          var nodeI = ~~(i / 5);
          node = nodes[nodeI]
          bbi = boundingBoxes[nodeI]
          xi = node.x + node.vx
          yi = node.y + node.vy
          nx1 = xi + bbi[0][0]
          ny1 = yi + bbi[0][1]
          nx2 = xi + bbi[1][0]
          ny2 = yi + bbi[1][1]
          tree.visit(apply);
        }
      }

      function apply(quad, x0, y0, x1, y1) {
        var data = quad.data
        if (data) {
          var bWidth = bbLength(bbi, 0),
            bHeight = bbLength(bbi, 1);

          if (data.node.index !== nodeI) {
            var dataNode = data.node
            var bbj = boundingBoxes[dataNode.index],
              dnx1 = dataNode.x + dataNode.vx + bbj[0][0],
              dny1 = dataNode.y + dataNode.vy + bbj[0][1],
              dnx2 = dataNode.x + dataNode.vx + bbj[1][0],
              dny2 = dataNode.y + dataNode.vy + bbj[1][1],
              dWidth = bbLength(bbj, 0),
              dHeight = bbLength(bbj, 1)

            if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {

              var xSize = [Math.min.apply(null, [dnx1, dnx2, nx1, nx2]), Math.max.apply(null, [dnx1, dnx2, nx1, nx2])]
              var ySize = [Math.min.apply(null, [dny1, dny2, ny1, ny2]), Math.max.apply(null, [dny1, dny2, ny1, ny2])]

              var xOverlap = bWidth + dWidth - (xSize[1] - xSize[0])
              var yOverlap = bHeight + dHeight - (ySize[1] - ySize[0])

              var xBPush = xOverlap * strength / 10 * (yOverlap / bHeight)
              var yBPush = yOverlap * strength * (xOverlap / bWidth)

              var xDPush = xOverlap * strength / 10 * (yOverlap / dHeight)
              var yDPush = yOverlap * strength * (xOverlap / dWidth)

              if ((nx1 + nx2) / 2 < (dnx1 + dnx2) / 2) {
                node.vx -= xBPush
                dataNode.vx += xDPush
              } else {
                node.vx += xBPush
                dataNode.vx -= xDPush
              }
              if ((ny1 + ny2) / 2 < (dny1 + dny2) / 2) {
                node.vy -= yBPush
                dataNode.vy += yDPush
              } else {
                node.vy += yBPush
                dataNode.vy -= yDPush
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
        return quad.bb = boundingBoxes[quad.data.node.index]
      }
      quad.bb = [[0, 0], [0, 0]]
      for (var i = 0; i < 4; ++i) {
        if (quad[i] && quad[i].bb[0][0] < quad.bb[0][0]) {
          quad.bb[0][0] = quad[i].bb[0][0]
        }
        if (quad[i] && quad[i].bb[0][1] < quad.bb[0][1]) {
          quad.bb[0][1] = quad[i].bb[0][1]
        }
        if (quad[i] && quad[i].bb[1][0] > quad.bb[1][0]) {
          quad.bb[1][0] = quad[i].bb[1][0]
        }
        if (quad[i] && quad[i].bb[1][1] > quad.bb[1][1]) {
          quad.bb[1][1] = quad[i].bb[1][1]
        }
      }
    }

    function bbLength(bbox, heightWidth) {
      return bbox[1][heightWidth] - bbox[0][heightWidth]
    }

    return force;
  }
}

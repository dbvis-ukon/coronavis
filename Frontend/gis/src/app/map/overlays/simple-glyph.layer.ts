import * as L from 'leaflet';
import * as d3 from 'd3';
import {Overlay} from './overlay';
import {TooltipService} from 'src/app/services/tooltip.service';
import {GlyphTooltipComponent} from 'src/app/glyph-tooltip/glyph-tooltip.component';
import {DiviHospital} from 'src/app/services/divi-hospitals.service';
import {ColormapService} from 'src/app/services/colormap.service';
import {Feature, FeatureCollection} from "geojson";
import {quadtree} from 'd3';

export class SimpleGlyphLayer extends Overlay<FeatureCollection> {

  private gHospitals: d3.Selection<SVGGElement, DiviHospital, SVGElement, unknown>;
  private map: L.Map;

  constructor(
    name: string,
    private data: DiviHospital[],
    private tooltipService: TooltipService,
    private colormapService: ColormapService
  ) {
    super(name, null);
    this.enableDefault = true;
  }


  private lastTransform;

  private labelLayout;

  private latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }

  private rectSize = 10;
  private glyphSize = {
    width: 50,
    height: 22
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
        return `translate(${p.x}, ${p.y})`;
      })
      .on('mouseenter', function (d1: DiviHospital) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        // console.log('mouseenter', d1);
        t.diviHospital = d1;
        d3.select(this).raise();
      })
      .on('mouseleave', () => this.tooltipService.close());

    this.gHospitals
      .append('rect')
      .attr('width', this.glyphSize.width)
      .attr('height', this.glyphSize.height)
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
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .style('fill', d1 => colorScale(d1.icuLowCare))
      .attr('x', padding)
      .attr('y', yOffset);

    this.gHospitals
      .append('rect')
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', `${this.rectSize}px`)
      .style('fill', d1 => colorScale(d1.icuHighCare))
      .attr('y', yOffset)
      .attr('x', `${this.rectSize + padding * 2}px`);

    this.gHospitals
      .append('rect')
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('x', `${2 * this.rectSize}px`)
      .style('fill', d1 => colorScale(d1.ECMO))
      .attr('y', yOffset)
      .attr('x', `${2 * this.rectSize + padding * 3}px`);

    this.onZoomed();

    return L.svgOverlay(svgElement, latLngBounds, {
      interactive: true,
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
    const scale = Math.pow(9 / (zoom), 3);

    this.data.forEach(d => {
      d.x = d._x;
      d.y = d._y;
    });

    if (this.labelLayout) {
      this.labelLayout.stop();
    }
    this.labelLayout = this.startForceSimulation([[-this.glyphSize.width * scale / 2, -this.glyphSize.height * scale / 2], [this.glyphSize.width * scale / 2, this.glyphSize.height * scale / 2]]);

    console.log('zoomed', this.map.getZoom(), scale);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(100)
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

              var xBPush = xOverlap * strength / 5 * (yOverlap / bHeight)
              var yBPush = yOverlap * strength * (xOverlap / bWidth)

              var xDPush = xOverlap * strength / 5 * (yOverlap / dHeight)
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

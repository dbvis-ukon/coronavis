import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { DiviHospital } from 'src/app/services/divi-hospitals.service';
import { ColormapService } from 'src/app/services/colormap.service';
import {Point} from 'leaflet';

export class SimpleGlyphLayer extends Overlay {

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

  private rectSize = 10;

  createOverlay(map: L.Map) {
    this.map = map;

    this.map.on('zoom', (d) => {
      this.onZoomed();
    });


    const latExtent = d3.extent(this.data, i => i.Location.lat);
    const lngExtent = d3.extent(this.data, i => i.Location.lng);

    let latLngBounds = new L.LatLngBounds([latExtent[0], lngExtent[0]], [latExtent[1], lngExtent[1]]);

    latLngBounds = latLngBounds.pad(10);

    const lpMin = this.map.latLngToLayerPoint(latLngBounds.getSouthWest());
    const lpMax = this.map.latLngToLayerPoint(latLngBounds.getNorthEast());

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
        const p = this.map.latLngToLayerPoint(d.Location);
        d.x = p.x;
        d.y = p.y;
        d._x = p.x;
        d._y = p.y;
        d.vx = 1;
        d.vy = 1;
        // console.log(p, d.Location);
        return `translate(${p.x}, ${p.y})`; })
      .on('mouseenter', function(d1: DiviHospital) {
        const evt: MouseEvent = d3.event;
        const t = self.tooltipService.openAtElementRef(GlyphTooltipComponent, {x: evt.clientX, y: evt.clientY});
        // console.log('mouseenter', d1);
        t.diviHospital = d1;
        d3.select(this).raise();
      })
      .on('mouseleave', () => this.tooltipService.close());

    this.gHospitals
      .append('rect')
      .attr('width', '50')
      .attr('height', '22')
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

    this.labelLayout = this.getForceSimulation();

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

  ticked() {
    // this.gHospitals.each(this.collide(0.3));
    this.gHospitals.attr('transform', (d, i) => {
      return `translate(${d.x},${d.y})`;
    });
  }

  /*
   * Rectangular Force Collision
   * https://bl.ocks.org/cmgiven/547658968d365bcc324f3e62e175709b
   */
  getForceSimulation(scale: number = 1): d3.Simulation<any, undefined> {
    const col = this.rectCollide();
    col.size([50 * scale, 22 * scale]);
    col.initialize(this.data);
    return d3.forceSimulation(this.data)
      .velocityDecay(0.3)
      .alphaTarget(0.3)
      .force('collision', col)
      .force('charge', d3.forceManyBody().distanceMin(22 * scale * 2).strength(0.3))
      .force('x', d3.forceX((d: any) => d._x).strength(0.3))
      .force('y', d3.forceY((d: any) => d._y).strength(0.3))
      .on('tick', () => {
        return this.ticked();
      });
      // d3.forceCollide( (d) => 30 * scale).iterations(5).strength(0.2) )
      // .alphaTarget(0.3)
      // .force('charge', d3.forceManyBody().strength(0.1));
  }

  onZoomed() {
    const zoom = this.map.getZoom();
    const scale = Math.pow(9 / (zoom), 3);

    this.labelLayout.stop();
    this.labelLayout = this.getForceSimulation(scale);

    console.log('zoomed', this.map.getZoom(), scale);

    this.gHospitals
      .selectAll('*')
      .transition()
      .duration(500)
      .attr('transform', d => {
        return `scale(${scale}, ${scale})`;
      });
  }

  rectCollide() {
    var nodes, sizes;
    var size = this.constant([0, 0]);
    var strength = 1;
    var iterations = 1;

    function force() {
      var node, size, xi, yi;
      var i = -1;
      while (++i < iterations) { iterate() }

      function iterate() {
        var j = -1;
        var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare);

        while (++j < nodes.length) {
          node = nodes[j];
          size = sizes[j];
          xi = xCenter(node);
          yi = yCenter(node);

          tree.visit(apply);
        }
      }

      function apply(quad, x0, y0, x1, y1) {
        var data = quad.data;
        var xSize = (size[0] + quad.size[0]) / 2;
        var ySize = (size[1] + quad.size[1]) / 2;
        if (data) {
          if (data.index <= node.index) { return }

          var x = xi - xCenter(data);
          var y = yi - yCenter(data);
          var xd = Math.abs(x) - xSize;
          var yd = Math.abs(y) - ySize;

          if (xd < 0 && yd < 0) {
            var l = Math.sqrt(x * x + y * y);

            if (Math.abs(xd) < Math.abs(yd)) {
              node.vx -= (x *= xd / l * strength);
              data.vx += x;
            } else {
              node.vy -= (y *= yd / l * strength);
              data.vy += y;
            }
          }
        }

        return x0 > xi + xSize || y0 > yi + ySize ||
          x1 < xi - xSize || y1 < yi - ySize;
      }

      function prepare(quad) {
        if (quad.data) {
          quad.size = sizes[quad.data.index];
        } else {
          quad.size = [0, 0];
          var i = -1;
          while (++i < 4) {
            if (quad[i] && quad[i].size) {
              quad.size[0] = Math.max(quad.size[0], quad[i].size[0]);
              quad.size[1] = Math.max(quad.size[1], quad[i].size[1]);
            }
          }
        }
      }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2; }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2; }

    force.initialize = (_) => {
      sizes = (nodes = _).map(size);
    };

    force.size = (_) => {
      return (arguments.length
        ? (size = typeof _ === 'function' ? _ : this.constant(_), force) : size);
    };

    force.strength = (_) => {
      return (arguments.length ? (strength = +_, force) : strength);
    };

    force.iterations = (_) => {
      return (arguments.length ? (iterations = +_, force) : iterations);
    };

    return force;
  }

  constant(_) {
    return () => _;
  }
}

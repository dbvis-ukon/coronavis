import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { TooltipDemoComponent } from 'src/app/tooltip-demo/tooltip-demo.component';
import { DiviHospital } from 'src/app/services/divi-hospitals.service';
import { LatLng } from "leaflet";

export class SimpleGlyphLayer extends Overlay {

  constructor(name: string, private map: L.Map, private data: DiviHospital[], private tooltipService: TooltipService) {
    super(name, null);
  }

  createOverlay() {
    // calculate new color scale
    // .domain expects an array of [min, max] value
    // d3.extent returns exactly this array
    const colorScale = d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range(['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)', '#bbbbbb']);

    const locationPoints = this.data.map(d => this.map.latLngToContainerPoint(d.Location));
    const [xMin, xMax] = d3.extent(locationPoints, d => d.x);
    const [yMin, yMax] = d3.extent(locationPoints, d => d.y);

    const svgElement: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);

    // const gHos = d3.select(svgElement)
    //   .selectAll('g.hospital')
    //   .data<DiviHospital>(this.data)
    //   .enter()
    //   .append<SVGGElement>('g')
    //   .attr('class', 'hospital')
    //   .on('mouseenter', d => {
    //     console.log('mouseenter', d);
    //     const evt: MouseEvent = d3.event;
    //     const t = this.tooltipService.openAtElementRef(TooltipDemoComponent, {x: evt.clientX, y: evt.clientY}, []);
    //     t.text = d.Name;
    //   })
    //   .on('mouseout', () => this.tooltipService.close())
    //   .attr('transform', d => {
    //     const p = this.map.latLngToLayerPoint(d.Location);
    //     console.log(p, d.Location);
    //     return `translate(${p.x}, ${p.y})`;
    //   });



    const gHostpitals = d3.select(svgElement)
      .selectAll('g.hospital')
      .data<DiviHospital>(this.data)
      .enter()
      .append<SVGGElement>('g')
      .attr('class', 'hospital')
      .attr('transform', d => {
        const p = this.map.latLngToLayerPoint(d.Location);
        console.log(p, d.Location);
        return `translate(${p.x}, ${p.y})`
      })
      .on('mouseenter', d1 => {
        const evt: MouseEvent = d3.event;
        const t = this.tooltipService.openAtElementRef(TooltipDemoComponent, { x: evt.clientX, y: evt.clientY }, [
          {
            overlayX: 'start',
            overlayY: 'top',
            originX: 'end',
            originY: 'bottom',
            offsetX: 5,
            offsetY: 5
          },
          {
            overlayX: 'end',
            overlayY: 'top',
            originX: 'start',
            originY: 'bottom',
            offsetX: -5,
            offsetY: 5
          },
          {
            overlayX: 'start',
            overlayY: 'bottom',
            originX: 'end',
            originY: 'top',
            offsetX: 5,
            offsetY: -5
          },
          {
            overlayX: 'end',
            overlayY: 'bottom',
            originX: 'start',
            originY: 'top',
            offsetX: -5,
            offsetY: -5
          },
        ]);
        t.text = d1.Name;
      })
      .on('mouseout', () => this.tooltipService.close());

    const rectSize = 10;

    const padding = 2;
    const yOffset = 10;

    gHostpitals
      .append('rect')
      .attr('width', '50')
      .attr('height', '22')
      .attr('fill', 'white')
      .attr('stroke', '#cccccc');

    let hospitalName = gHostpitals
      .append('text')
      .text(d1 => {
        // Hackity hack :)
        const splitted = d1.Adress.split(" ");
        return splitted[splitted.length - 1]
      })
      .attr('x', padding)
      .attr('y', '8')
      .attr('font-size', '8px');

    gHostpitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('x', padding)
      .attr('y', yOffset)
      .style('fill', d1 => colorScale(d1.icuLowCare));

    gHostpitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${rectSize + padding * 2}px`)
      .style('fill', d1 => colorScale(d1.icuHighCare));

    gHostpitals
      .append('rect')
      .attr('width', `${rectSize}px`)
      .attr('height', `${rectSize}px`)
      .attr('y', yOffset)
      .attr('x', `${2 * rectSize + padding * 3}px`)
      .style('fill', d1 => colorScale(d1.ECMO));


    // gHos
    //   .append('rect')
    //   .attr('width', '30px')
    //   .attr('height', '30px')
    //   .style('fill', d => colorScale(d.icuLowCare));
    //
    const latExtent = d3.extent(this.data, i => i.Location.lat);
    const lngExtent = d3.extent(this.data, i => i.Location.lng);

    return L.svgOverlay(svgElement, [[latExtent[0], lngExtent[0]], [latExtent[1], lngExtent[1]]], { interactive: true });
    // return L.svgOverlay(svgElement, this.map.getBounds());
  }
}

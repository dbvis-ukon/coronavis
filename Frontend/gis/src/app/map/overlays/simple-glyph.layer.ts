import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { TooltipDemoComponent } from 'src/app/tooltip-demo/tooltip-demo.component';
import { DiviHospital } from 'src/app/services/divi-hospitals.service';

export class SimpleGlyphLayer extends Overlay {

    constructor(name: string, private map: L.Map, private data: DiviHospital[], private tooltipService: TooltipService) {
        super(name, null);
    }

    createOverlay() {
        // calculate new color scale
        // .domain expects an array of [min, max] value
        // d3.extent returns exactly this array
        const colorScale = d3.scaleOrdinal<string, string>().domain(['Verfügbar' , 'Begrenzt' , 'Ausgelastet' , 'Nicht verfügbar'])
        .range(['green', 'yellow', 'red', 'black']);

        const latExtent = d3.extent(this.data, i => i.Location.lat);
        const lngExtent = d3.extent(this.data, i => i.Location.lng);

        const svgElement: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        // svgElement.setAttribute('viewBox', "0 0 200 200");

        const gHos = d3.select(svgElement)
            .selectAll('g.hospital')
            .data<DiviHospital>(this.data)
            .enter()
            .append<SVGGElement>('g')
            .attr('class', 'hospital')
            .on('mouseenter', d => {
                console.log('mouseenter', d);
                const evt: MouseEvent = d3.event;
                const t = this.tooltipService.openAtElementRef(TooltipDemoComponent, {x: evt.clientX, y: evt.clientY}, []);
                t.text = d.Name;
            })
            .on('mouseout', () => this.tooltipService.close())
            .attr('transform', d => {
                const p = this.map.latLngToLayerPoint(d.Location);
                return `translate(${p.x}, ${p.y})`;
            });

        gHos
            .append('rect')
            .attr('width', '30px')
            .attr('height', '30px')
            .style('fill', d => colorScale(d.icuLowCare));

        return L.svgOverlay(svgElement, [[latExtent[0], lngExtent[0]], [latExtent[1], lngExtent[1]]]);
    }
}

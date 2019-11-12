import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import * as d3 from 'd3';


class Overlay {

    name: string;
    featureCollection: FeatureCollection;

    constructor(name: string, featureCollection: FeatureCollection) {
        this.name = name;
        this.featureCollection = featureCollection;
    }

    createOverlay() {
        return L.geoJSON(this.featureCollection);
    }
}

class LandkreisLayer extends Overlay {

    constructor(name: string, featureCollection: FeatureCollection) {
        super(name, featureCollection);
    }

    createOverlay() {
        // calculate new color scale
        // .domain expects an array of [min, max] value
        // d3.extent returns exactly this array
        const minMaxArea = d3.extent(this.featureCollection.features.map(d => d.properties.area));
        const colorScale = d3.scaleSequential(d3.interpolateReds).domain(minMaxArea);

        // create tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('id', 'landkreis-tooltip')
            .attr('class', 'map-tooltip')
            .style('display', 'none');

        tooltip.append('h3').text('County Information:');
        const nameP = tooltip.append('p');
        const areaP = tooltip.append('p');

        // create geojson layer (looks more complex than it is)
        const landKreiseLayer = L.geoJSON(this.featureCollection, {
            style: (feature) => {
                return {
                    fillColor: colorScale(feature.properties.area),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    // on mouseover update tooltip and highlight county
                    mouseover: (e: L.LeafletMouseEvent) => {

                        // set position and text of tooltip
                        tooltip.style('display', null);
                        tooltip.style('top', `${e.originalEvent.clientY - 75}px`);
                        tooltip.style('left', `${e.originalEvent.clientX + 25}px`);
                        nameP.text(`County: ${feature.properties.name}`);
                        areaP.text(`Area: ${feature.properties.area}`);

                        // set highlight style
                        const l = e.target;
                        l.setStyle({
                            weight: 5,
                            color: '#666',
                            dashArray: '',
                            fillOpacity: 0.7
                        });

                        l.bringToFront();
                    },
                    // on mouseover hide tooltip and reset county to normal sytle
                    mouseout: (e: L.LeafletMouseEvent) => {
                        tooltip.style('display', 'none');
                        landKreiseLayer.resetStyle(e.target);
                    }
                });
            }
        });

        return landKreiseLayer;
    }
}

class BardichteLayer extends Overlay {

    constructor(name: string, featureCollection: FeatureCollection) {
        super(name, featureCollection);
    }

    createOverlay() {
        // calculate new color scale
        // .domain expects an array of [min, max] value
        // d3.extent returns exactly this array
        const minMaxBars = d3.extent(this.featureCollection.features.map(d => d.properties.num_bars));
        const colorScale = d3.scaleSequential(d3.interpolateReds).domain(minMaxBars);

        // create tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('id', 'bardichte-tooltip')
            .attr('class', 'map-tooltip')
            .style('display', 'none');

        tooltip.append('h3').text('Bar Dichte:');
        const nameP = tooltip.append('p');
        const areaP = tooltip.append('p');

        // create geojson layer (looks more complex than it is)
        const bardichteLayer = L.geoJSON(this.featureCollection, {
            style: (feature) => {
                return {
                    fillColor: colorScale(feature.properties.num_bars),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    // on mouseover update tooltip and highlight county
                    mouseover: (e: L.LeafletMouseEvent) => {

                        // set position and text of tooltip
                        tooltip.style('display', null);
                        tooltip.style('top', `${e.originalEvent.clientY - 75}px`);
                        tooltip.style('left', `${e.originalEvent.clientX + 25}px`);
                        nameP.text(`County: ${feature.properties.name}`);
                        areaP.text(`Num Bars: ${feature.properties.num_bars}`);

                        // set highlight style
                        const l = e.target;
                        l.setStyle({
                            weight: 5,
                            color: '#666',
                            dashArray: '',
                            fillOpacity: 0.7
                        });

                        l.bringToFront();
                    },
                    // on mouseover hide tooltip and reset county to normal sytle
                    mouseout: (e: L.LeafletMouseEvent) => {
                        tooltip.style('display', 'none');
                        bardichteLayer.resetStyle(e.target);
                    }
                });
            }
        });

        return bardichteLayer;
    }
}

export { Overlay, LandkreisLayer, BardichteLayer };

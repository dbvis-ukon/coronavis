import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import * as d3 from 'd3';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';

export class LandkreisLayer extends Overlay {

    constructor(name: string, featureCollection: FeatureCollection, private tooltipService: TooltipService) {
        super(name, featureCollection);
    }

    createOverlay() {
        // calculate new color scale
        // .domain expects an array of [min, max] value
        // d3.extent returns exactly this array
        const minMaxArea = d3.extent(this.featureCollection.features.map(d => d.properties.area));
        const colorScale = d3.scaleSequential(d3.interpolateReds).domain(minMaxArea);

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

                        const tooltipComponent = this.tooltipService
                        .openAtElementRef(GlyphTooltipComponent, {x: e.originalEvent.clientX, y: e.originalEvent.clientY});

                        tooltipComponent.name = `County: ${feature.properties.name}`;

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
                        this.tooltipService.close();
                        landKreiseLayer.resetStyle(e.target);
                    }
                });
            }
        });

        return landKreiseLayer;
    }
}

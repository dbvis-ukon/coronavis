import { FeatureCollection } from 'geojson';

import * as L from 'leaflet';
import * as d3 from 'd3';

export class Overlay {

    name: string;
    featureCollection: FeatureCollection;

    constructor(name: string, featureCollection: FeatureCollection) {
        this.name = name;
        this.featureCollection = featureCollection;
    }

    createOverlay(): L.GeoJSON<any> | L.SVGOverlay {
        return L.geoJSON(this.featureCollection);
    }
}

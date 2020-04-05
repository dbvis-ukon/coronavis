import { FeatureCollection } from 'geojson';
import * as L from 'leaflet';


export class Overlay<F extends FeatureCollection> {

    name: string;
    featureCollection: F;

    enableDefault = false;

    constructor(name: string, featureCollection: F) {
        this.name = name;
        this.featureCollection = featureCollection;
    }

    createOverlay(map: L.Map): L.GeoJSON<any> | L.SVGOverlay {
        return L.geoJSON(this.featureCollection);
    }
}

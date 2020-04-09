import { FeatureCollection, Geometry } from 'geojson';
import * as L from 'leaflet';


export class Overlay<P> {

    name: string;
    featureCollection: FeatureCollection<Geometry, P>;

    enableDefault = false;

    constructor(name: string, featureCollection: FeatureCollection<Geometry, P>) {
        this.name = name;
        this.featureCollection = featureCollection;
    }

    getData(): FeatureCollection<Geometry, P> {
        return this.featureCollection;
    }

    createOverlay(map: L.Map): L.GeoJSON<any> | L.SVGOverlay {
        return L.geoJSON(this.featureCollection);
    }
}

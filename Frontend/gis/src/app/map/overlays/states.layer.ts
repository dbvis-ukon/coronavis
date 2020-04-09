import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import * as L from 'leaflet';
import { Overlay } from './overlay';


export class StatesLayer extends Overlay<GeoJsonProperties> {
    constructor(name: string, featureCollection: FeatureCollection<Geometry, GeoJsonProperties>) {
        super(name, featureCollection);
    }

    createOverlay() {

        // create geojson layer (looks more complex than it is)
        const landKreiseLayer = L.geoJSON(this.featureCollection, {
            style: () => {
                return {
                    fillColor: 'grey',
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7,
                  pointerEvents: false
                };
            }
        });

        return landKreiseLayer;
    }
}

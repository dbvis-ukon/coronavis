import { LatLngLiteral } from 'leaflet';

export interface FlyTo {
    loc: LatLngLiteral;

    zoom: number;
}

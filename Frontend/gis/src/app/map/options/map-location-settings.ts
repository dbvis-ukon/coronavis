export interface MapLocationSettings {

    /**
     * determined by map.getBounds().getCenter()
     */
    center: L.LatLngExpression;

    /**
     * determined by map.getZoom()
     */
    zoom: number;


    allowPanning: boolean;


    allowZooming: boolean;

}

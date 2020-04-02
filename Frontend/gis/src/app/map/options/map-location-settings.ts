export interface MapLocationSettings {

    /**
     * determined by map.getBounds().getCenter()
     */ 
    center: L.LatLngLiteral;

    /**
     * determined by map.getZoom()
     */
    zoom: number;

}
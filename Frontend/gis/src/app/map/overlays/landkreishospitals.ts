import { FeatureCollection, Polygon } from 'geojson';
import * as L from 'leaflet';
import { QualitativeAggregatedHospitalProperties } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { Overlay } from './overlay';


export class LandkreiseHospitalsLayer extends Overlay<QualitativeAggregatedHospitalProperties> {
  constructor(
    name: string,
    featureCollection: FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>
  ) {
    super(name, featureCollection);
  }

  createOverlay() {

    // create geojson layer (looks more complex than it is)
    const landkreiseHospitalsLayer = L.geoJSON(this.featureCollection, {
      style: () => {
          return {
              fillColor: 'transparent',
              interactive: false,
              weight: 0.5,
              opacity: 1,
              color: 'grey',
              // dashArray: '3',
              // fillOpacity: 0.7
          };
      }});

    return landkreiseHospitalsLayer;
  }
}

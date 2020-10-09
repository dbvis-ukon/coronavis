import { FeatureCollection, Point } from 'geojson';
import * as L from 'leaflet';
import { OSMHospitalProperties } from 'src/app/repositories/types/in/osm-hospitals';
import { TooltipService } from 'src/app/services/tooltip.service';
import { OsmTooltipComponent } from '../../osm-tooltip/osm-tooltip.component';
import { Overlay } from './overlay';




export class HospitalLayer extends Overlay < OSMHospitalProperties > {
  constructor(
    name: string,
    featureCollection: FeatureCollection<Point, OSMHospitalProperties>,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {

    const krankenhausIcon = L.icon({
      iconUrl: 'assets/Krankenhaus.png',

      iconSize: [16, 16], // size of the iconow
      iconAnchor: [8, 8], // point of the icon which will correspond to marker's location
    });

    // create geojson layer (looks more complex than it is)
    const hospitalLayer = L.geoJSON(this.featureCollection, {
      pointToLayer: (_, latlng) => {
        return L.marker(latlng, {
          icon: krankenhausIcon
        }); // L.circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          // on mouseover update tooltip and highlight county
          click: (e: L.LeafletMouseEvent) => onAction(e, feature, hospitalLayer),
          mouseover: (e: L.LeafletMouseEvent) => onAction(e, feature, hospitalLayer),
          // on mouseover hide tooltip and reset county to normal sytle
          mouseout: (e: L.LeafletMouseEvent) => {
            this.tooltipService.close();
          }
        });
      }
    });

    const onAction = (e: L.LeafletMouseEvent, feature: any, aggregationLayer: any) => {
      const onCloseAction: () => void = () => {
        aggregationLayer.resetStyle(e.target);
      };

      const tooltipComponent = this.tooltipService
        .openAtElementRef(OsmTooltipComponent, {
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY
        }, onCloseAction);

      tooltipComponent.name = feature.properties.name;
      tooltipComponent.type = 'hospital';
    };
    return hospitalLayer;
  }
}

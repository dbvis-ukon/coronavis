import * as L from 'leaflet';
import { Overlay } from './overlay';
import { TooltipService } from 'src/app/services/tooltip.service';
import { OSMNearbyHelipads } from 'src/app/repositories/types/in/osm-helipads';
import {OsmTooltipComponent} from "../../osm-tooltip/osm-tooltip.component";

const helipadIcon = L.icon({
   iconUrl: 'assets/Helipad.png',

   iconSize:     [16, 16], // size of the iconow
   iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
});

export class HelipadLayer extends Overlay<OSMNearbyHelipads> {
  constructor(
    name: string,
    featureCollection: OSMNearbyHelipads,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {
    const geojsonMarkerOptions = {
      radius: 4,
      fillColor: '#8461c4',
      // icon: helipadIcon,
      color: '#8461c4',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };

    // create geojson layer (looks more complex than it is)
    const helipadLayer = L.geoJSON(this.featureCollection, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {icon: helipadIcon});//L.circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          // on mouseover update tooltip and highlight county
          click: (e: L.LeafletMouseEvent) => onAction(e, feature, helipadLayer),
          mouseover: (e: L.LeafletMouseEvent) => onAction(e, feature, helipadLayer),
          // on mouseover hide tooltip and reset county to normal sytle
          mouseout: (e: L.LeafletMouseEvent) => {
            this.tooltipService.close();
          }
        });
      }
    }
    );

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
      tooltipComponent.type = "helipad";

      // set highlight style
      const l = e.target;
      l.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });

      // l.bringToFront();
    };

    return helipadLayer;
  }
}

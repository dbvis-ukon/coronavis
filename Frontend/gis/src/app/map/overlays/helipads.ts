import { FeatureCollection, Point } from 'geojson';
import * as L from 'leaflet';
import { OSMHelipadProperties } from 'src/app/repositories/types/in/osm-helipads';
import { TooltipService } from 'src/app/services/tooltip.service';
import { OsmTooltipComponent } from '../../osm-tooltip/osm-tooltip.component';
import { Overlay } from './overlay';



export class HelipadLayer extends Overlay < OSMHelipadProperties > {
  constructor(
    name: string,
    featureCollection: FeatureCollection<Point, OSMHelipadProperties>,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {
    const helipadIcon = L.icon({
      iconUrl: 'assets/Helipad.png',

      iconSize: [16, 16], // size of the iconow
      iconAnchor: [8, 8], // point of the icon which will correspond to marker's location
    });

    // create geojson layer (looks more complex than it is)
    const helipadLayer = L.geoJSON(this.featureCollection, {
      pointToLayer: (_, latlng) =>
         L.marker(latlng, {
          icon: helipadIcon
        }) // L.circleMarker(latlng, geojsonMarkerOptions);
      ,
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
      tooltipComponent.type = 'helipad';
    };

    return helipadLayer;
  }
}

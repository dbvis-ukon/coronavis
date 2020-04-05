import * as L from 'leaflet';
import { OSMHospitals } from 'src/app/repositories/types/in/osm-hospitals';
import { TooltipService } from 'src/app/services/tooltip.service';
import { OsmTooltipComponent } from "../../osm-tooltip/osm-tooltip.component";
import { Overlay } from './overlay';


const krankenhausIcon = L.icon({
  iconUrl: 'assets/Krankenhaus.png',

  iconSize:     [16, 16], // size of the iconow
  iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
});

export class HospitalLayer extends Overlay<OSMHospitals> {
  constructor(
    name: string,
    featureCollection: OSMHospitals,
    private tooltipService: TooltipService
  ) {
    super(name, featureCollection);
  }

  createOverlay() {
    const geojsonMarkerOptions = {
      radius: 3,
      fillColor: '#666',
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };

    // create geojson layer (looks more complex than it is)
    const hospitalLayer = L.geoJSON(this.featureCollection, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {icon: krankenhausIcon}); //L.circleMarker(latlng, geojsonMarkerOptions);
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
      }}
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
        tooltipComponent.type = "hospital";
  
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
    return hospitalLayer;
  }
}

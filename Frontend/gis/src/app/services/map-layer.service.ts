import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HospitallayerService } from './hospitallayer.service';
import { GeoJSON } from 'leaflet';
import { GlyphHoverEvent } from '../map/events/glyphhover';
import { DiviHospitalsService } from './divi-hospitals.service';
import { SimpleGlyphLayer } from '../map/overlays/simple-glyph.layer';
import { TooltipService } from './tooltip.service';
import { ColormapService } from './colormap.service';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapLayerService {

  public leafletMap: Subject<L.Map> = new Subject();

  private choroplethLayerMap = new Map<String, GeoJSON>();

  constructor(
    private hospitallayerService: HospitallayerService,
    private diviHospitalsService: DiviHospitalsService,
    private tooltipService: TooltipService,
    private colormapService: ColormapService
  ) {
    this.leafletMap.subscribe(map => this.initLayers(map));
  }

  /**
   * Requests all layers from the API and stores them appropriately to bootstrap everything
   * @param map the leaflet map
   */
  initLayers(map: L.Map) {
    const layerControl: L.Control.Layers = L.control.layers().addTo(map);


    this.hospitallayerService.getLayers().subscribe(layer => {
      this.choroplethLayerMap.set(layer.name, layer.createOverlay());
    });

    const layerEvents: Subject<GlyphHoverEvent> = new Subject<GlyphHoverEvent>();
    layerEvents.subscribe(event => {
      const layer = this.choroplethLayerMap.get(event.name);
      if (layer) {
        if (event.type === "enter") {
          map.addLayer(layer);
        } else {
          map.removeLayer(layer);
        }
      }
    });



    // GLYPH MAPS
    this.diviHospitalsService.getDiviHospitals().subscribe(data => {
      const glyphLayer = new SimpleGlyphLayer('hos_single', data, this.tooltipService, this.colormapService);
      this.glyphLayerOverlay = glyphLayer.createOverlay(map);

      // this.mymap.addLayer(glyphs.createOverlay());
      this.layerControl.addOverlay(this.glyphLayerOverlay, glyphLayer.name);
      this.mymap.addLayer(this.glyphLayerOverlay);
      this.semanticZoom();
    });
  }
}

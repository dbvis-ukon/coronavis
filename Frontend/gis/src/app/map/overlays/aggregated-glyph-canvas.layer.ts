import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject } from 'rxjs';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { AbstractGlyphCanvasLayer } from './abstract-glyph-canvas.layer';

export class AggregatedGlyphCanvasLayer extends AbstractGlyphCanvasLayer<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>> {

  protected showText: boolean = true;

  constructor(
    name: string,
    data: FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>,
    aggLevel: AggregationLevel,
    tooltipService: TooltipService,
    colormapService: QualitativeColormapService,
    glyphOptions: BehaviorSubject<BedGlyphOptions>,
    dialog: MatDialog,
    storage: LocalStorageService
  ) {
    super(name, data, aggLevel, tooltipService, colormapService, glyphOptions, dialog, storage);
  }

  latAcc(d: Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>): number {
    return d.properties.centroid.coordinates[1];
  }
  
  lngAcc(d: Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>): number {
    return d.properties.centroid.coordinates[0];
  }

  protected drawAdditionalFeatures(data: Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>, pt: L.Point) {
    if(this.showText) {
      this.drawText(data.properties.name, pt, 0);
    }
  }



  updateCurrentScale(): void {
    const zoom = this._map.getZoom();

    // let scale = Math.pow(9 / (zoom), 2);
    let scale = 1;

    this.showText = true;

    if(this.granularity === AggregationLevel.county) {
      if(zoom <= 7) {
        this.showText = false;
      }
      if(zoom < 8) {
        scale = Math.pow(zoom / 8, 2);
      }

      if(zoom > 10) {
        scale = Math.pow(zoom / 10, 2);
      }
    } else if (this.granularity === AggregationLevel.governmentDistrict && zoom >= 7) {
      scale = Math.pow(zoom / 7, 2);
    } else if (this.granularity === AggregationLevel.state) {
      scale = Math.pow(zoom / 5, 2);
    }

    console.log('scale', zoom, scale);

    // scale = Math.pow(level / (zoom), 3);

    this.currentScale = scale;
  }

}
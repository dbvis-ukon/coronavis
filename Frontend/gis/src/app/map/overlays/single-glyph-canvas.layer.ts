import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, Point } from 'geojson';
import { Bounds } from 'leaflet';
import { MyLocalStorageService } from '../../services/my-local-storage.service';
import { BehaviorSubject } from 'rxjs';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { AbstractGlyphCanvasLayer } from './abstract-glyph-canvas.layer';

export class SingleGlyphCanvasLayer extends AbstractGlyphCanvasLayer<Point, SingleHospitalOut<QualitativeTimedStatus>> {
  private showCityHospitals = false;

  private showNameHospitals = false;

  // Some cities have double names. These are the first parts
  private doubleNames = new Set(['Sankt', 'St.', 'Bergisch', 'Königs', 'Lutherstadt', 'Schwäbisch']);
  // Regexes for cleaning city names
  private rxAdr = /.*\d{4,5} /;
  private rxBad = /^Bad /;
  private rxSlash = /\/.*/;
  private rxDash = /-([A-Z])[a-zäöü]{6,}/;

  constructor(
    name: string,
    data: FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>,
    tooltipService: TooltipService,
    colormapService: QualitativeColormapService,
    glyphOptions: BehaviorSubject<BedGlyphOptions>,
    dialog: MatDialog,
    storage: MyLocalStorageService
  ) {
    super(name, data, AggregationLevel.none, tooltipService, colormapService, glyphOptions, dialog, storage);
  }

  latAcc(d: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>): number {
    return d.geometry.coordinates[1];
  }

  lngAcc(d: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>): number {
    return d.geometry.coordinates[0];
  }

  protected drawAdditionalFeatures(data: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, pt: L.Point, isHovered: boolean) {
    let bounds = new Bounds(pt, pt);

    if (this.showNameHospitals) {
      const b = this.drawText(data.properties.name, pt, 0, isHovered);
      bounds = bounds
        .extend(b.min)
        .extend(b.max);
    }


    if (this.showCityHospitals) {
      const b2 = this.drawText(this.shorten_city_name(data.properties.address), pt, 0, isHovered);
      bounds = bounds
        .extend(b2.min)
        .extend(b2.max);
    }

    return bounds;
  }

  updateCurrentScale(): void {
    const zoom = this._map.getZoom();

    // let scale = Math.pow(9 / (zoom), 2);
    let scale = 1;

    if (zoom < 9) {
      scale = Math.pow(zoom / 9, 3);
    }

    if (zoom >= 10) {
      scale = Math.pow(zoom / 10, 2);
    }

    this.currentScale = scale;

       // hidden by default
    this.showCityHospitals = false;
    this.showNameHospitals = false;


    // Resize glyph bounding boxes + show/hide labels
    if (zoom >= 12) {
      this.showNameHospitals = true;
      // true, true
    } else if (zoom <= 11 && zoom >= 10) {
      this.showCityHospitals = true;
    }
  }

  // Extract the city name from the address and shorten
  private shorten_city_name(address) {
    if (!address) {
      return '';
    }
    const nameParts = address.replace(this.rxAdr, '') // Remove address
        .replace(this.rxBad, '') // Remove 'Bad'
        .replace(this.rxSlash, '') // Remove additional descriptions
        .replace(this.rxDash, '-$1.') // Initials for second of double names
        .split(' ');
    return this.doubleNames.has(nameParts[0]) ? nameParts.slice(0, 2).join(' ') : nameParts[0];
  }

}

import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, Point } from 'geojson';
import { LocalStorageService } from 'ngx-webstorage';
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
    storage: LocalStorageService
  ) {
    super(name, data, AggregationLevel.none, tooltipService, colormapService, glyphOptions, dialog, storage);
  }

  latAcc(d: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>): number {
    return d.geometry.coordinates[1];
  }
  
  lngAcc(d: import("geojson").Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>): number {
    return d.geometry.coordinates[0];
  }

  protected drawAdditionalFeatures(data: Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, pt: L.Point) {
    if(this.showNameHospitals) {
      this.drawText(data.properties.name, pt, 0);
    }


    if(this.showCityHospitals) {
      this.drawText(this.shorten_city_name(data.properties.address), pt, 0);
    }
  }

  // returns height of this wrapped text
  protected drawText(text: string, pt: L.Point, yOffset: number): number {
    this.ctx.save();

    const centerX = pt.x + (this.getGlyphWidth() / 2);
    const belowGlyhY = pt.y + this.getGlyphHeight() + this.rectYOffset + yOffset;


    this.ctx.font = "bold 11px Roboto";
    this.ctx.fillStyle = 'black';
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    this.ctx.shadowColor = "rgba(255,255,255,1)";
    this.ctx.shadowBlur = 4;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    const lineHeight = 11;
    const wrappedText = this.getWrappedText(text, this.getGlyphWidth() * 4);

    for(let i = 0; i < wrappedText.length; i++) {
      this.ctx.fillText(wrappedText[i], centerX, belowGlyhY + i * lineHeight);
    }
    
    this.ctx.restore();

    return lineHeight * wrappedText.length;
  }

  updateCurrentScale(): void {
    const zoom = this._map.getZoom();

    // let scale = Math.pow(9 / (zoom), 2);
    let scale = 1;

    if(zoom < 9) {
      scale = Math.pow(zoom / 9, 2);
    }

    if(zoom >= 11) {
      scale = Math.pow(zoom/ 11, 2);
    }

    this.currentScale = scale;

       // hidden by default
    this.showCityHospitals = false;
    this.showNameHospitals = false;


    // Resize glyph bounding boxes + show/hide labels
    if (zoom >= 12) {
      this.showNameHospitals = true
      // true, true
    } else if (zoom <= 11 && zoom >= 9) {
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
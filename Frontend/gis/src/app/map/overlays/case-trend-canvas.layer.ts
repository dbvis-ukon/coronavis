import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { Bounds, Point } from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { RKICaseDevelopmentProperties } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { CovidNumberCaseOptions } from '../options/covid-number-case-options';
import { LabelCanvasLayer } from './label-canvas.layer';

export class CaseTrendCanvasLayer extends LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties> {

  protected rectWidth = 12;
  protected rectHeight = 12;

  constructor(
    name: string,
    data: FeatureCollection < MultiPolygon, RKICaseDevelopmentProperties > ,
    granularity: AggregationLevel,
    options$: BehaviorSubject < CovidNumberCaseOptions > ,
    storage: LocalStorageService,
    private caseUtil: CaseUtilService
  ) {
    super(name, data, granularity, options$, storage);
  }

  protected getGlyphWidth() {
    return Math.floor(this.rectWidth * this.currentScale);
  }

  protected getGlyphHeight() {
    return Math.floor(this.rectHeight * this.currentScale);
  }

  protected drawTrendGlyph(glyphData: Feature<MultiPolygon, RKICaseDevelopmentProperties>, pt: Point): Bounds {
    const topLeftPt = new Point(pt.x - (this.getGlyphWidth() / 2), pt.y - (this.getGlyphHeight() / 2));

    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(topLeftPt.x, topLeftPt.y, this.getGlyphWidth(), this.getGlyphHeight());

    this.caseUtil.getTrendForCase7DaysPer100k(glyphData.properties, 4)
    .pipe(
      map(t => this.caseUtil.getRotationForTrend(t.m))
    )
    .subscribe(rot => {
      this.ctx.save();

      this.ctx.translate(pt.x, pt.y);
      this.ctx.rotate(rot * Math.PI / 180);
      this.ctx.translate(-pt.x, -pt.y);
  
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2 * this.currentScale;
  
      this.ctx.beginPath();
      this.ctx.moveTo(topLeftPt.x, pt.y);
      this.ctx.lineTo(topLeftPt.x + this.getGlyphWidth(), pt.y);
      this.ctx.stroke();
  
      this.ctx.restore();
    })

    

    return new Bounds(topLeftPt, new Point(topLeftPt.x + this.rectWidth, topLeftPt.y + this.rectHeight));
  }

  protected drawLabel(glyphData: Feature < MultiPolygon, RKICaseDevelopmentProperties > ) {
    const pt = this.getGlyphPixelPos(glyphData);

    // let bounds = new Bounds(pt, new Point(pt.x + this.getGlyphWidth(), pt.y));
    let bounds = this.drawTrendGlyph(glyphData, pt);

    let boundsAdd = this.drawAdditionalFeatures(glyphData, new Point(pt.x, bounds.max.y + 3));

    bounds = bounds
      .extend(boundsAdd.min)
      .extend(boundsAdd.max);

    this.quadtree.push({
      x: bounds.min.x, //Mandatory
      y: bounds.min.y, //Mandatory
      width: bounds.getSize().x, //Optional, defaults to 1
      height: bounds.getSize().y, //Optional, defaults to 1
      payload: glyphData
    }) //Optional, defaults to false
  }
}
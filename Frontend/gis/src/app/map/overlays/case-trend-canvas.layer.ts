import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { Bounds, Point } from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { CovidNumberCaseOptions } from '../options/covid-number-case-options';
import { LabelCanvasLayer } from './label-canvas.layer';

interface StatusWithCache extends RKICaseTimedStatus {
  _regression?: {
    rotation: number;
  };
}

export class CaseTrendCanvasLayer extends LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties, CovidNumberCaseOptions> {

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

    const status = this.caseUtil.getTimedStatusWithOptions(glyphData.properties, this.options$.value) as StatusWithCache;

    let rot$: Observable<number>;
    if (status?._regression?.rotation) {
      rot$ = of(status._regression.rotation);
    } else {
      rot$ = this.caseUtil.getTrendForCase7DaysPer100k(glyphData.properties, this.options$.value.date, this.options$.value.daysForTrend)
      .pipe(
        map(t => this.caseUtil.getRotationForTrend(t.m)),
        tap(r => {
          if (status) {
            status._regression = {
              rotation: r
            };
          }
        })
      );
    }

    rot$.subscribe(rot => {
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
    });



    return new Bounds(topLeftPt, new Point(topLeftPt.x + this.getGlyphWidth(), topLeftPt.y + this.getGlyphHeight()));
  }

  protected drawLabel(glyphData: Feature < MultiPolygon, RKICaseDevelopmentProperties > ) {
    const opt = this.options$.value;
    if (this.caseUtil.isLockdownMode(opt) && opt.dataSource === 'risklayer' && opt.showOnlyAvailableCounties === true ) {
      const status = this.caseUtil.getTimedStatusWithOptions(glyphData.properties, this.options$.value) as StatusWithCache;
      if (!status.last_updated) {
        return;
      }
    }

    const pt = this.getGlyphPixelPos(glyphData);

    // let bounds = new Bounds(pt, new Point(pt.x + this.getGlyphWidth(), pt.y));
    let bounds;
    if (this.options$.value.showTrendGlyphs) {
      bounds = this.drawTrendGlyph(glyphData, pt);
    } else {
      bounds = new Bounds(pt, pt);
    }


    const boundsAdd = this.drawAdditionalFeatures(glyphData, new Point(pt.x, bounds.max.y + 3));

    bounds = bounds
      .extend(boundsAdd.min)
      .extend(boundsAdd.max);

    this.quadtree.push({
      x: bounds.min.x, // Mandatory
      y: bounds.min.y, // Mandatory
      width: bounds.getSize().x, // Optional, defaults to 1
      height: bounds.getSize().y, // Optional, defaults to 1
      payload: glyphData
    }); // Optional, defaults to false
  }
}

import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { Point } from 'leaflet';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { MyLocalStorageService } from '../../services/my-local-storage.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { CovidNumberCaseOptions } from '../options/covid-number-case-options';
import { LabelCanvasLayer, PreparedGlyph } from './label-canvas.layer';

export interface StatusWithCache extends RKICaseTimedStatus {
  _regression?: {
    rotation: number;
    m: number;
    b: number;
  };
}

interface PreparedGlyphWithRotation extends PreparedGlyph {
  rotation: number;
}

export class CaseTrendCanvasLayer extends LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties, CovidNumberCaseOptions> {

  protected rectWidth = 12;
  protected rectHeight = 12;

  constructor(
    name: string,
    data: FeatureCollection < MultiPolygon, RKICaseDevelopmentProperties > ,
    granularity: AggregationLevel,
    options$: BehaviorSubject < CovidNumberCaseOptions > ,
    storage: MyLocalStorageService,
    private caseUtil: CaseUtilService
  ) {
    super(name, data, granularity, options$, storage);
  }

  /**
   * Override
   *
   * @returns width of glyph
   */
  protected getGlyphWidth(): number {
    return Math.floor(this.rectWidth * this.currentScale);
  }

  /**
   * Override
   *
   * @returns height of glyph
   */
  protected getGlyphHeight(): number {
    return Math.floor(this.rectHeight * this.currentScale);
  }

  /**
   * Override
   *
   * @returns empty promise
   */
  protected async prepareAllGpyphs(): Promise<void> {
    if (!this._map || !this.data || !this.ctx) {
      return;
    }

    // required so that the showText attribute is properly set
    this.updateCurrentScale();

    this.preparedGlyphs = [];
    const opt = this.options$.value;
    if (opt.showTrendGlyphs === false) {
      return null;
    }
    for(const d of this.data.features) {
      if (this.caseUtil.isLockdownMode(opt)) {
        const status = this.caseUtil.getTimedStatusWithOptions(d.properties, this.options$.value) as StatusWithCache;
        if (opt.dataSource === 'risklayer' && opt.showOnlyAvailableCounties === true) {
          if (!status.last_updated) {
            continue;
          }
        }

        if (this.caseUtil.isEBrakeMode(opt) && !this.caseUtil.isEBrakeOver(d, opt)) {
          continue;
        }

        if (status?._regression && opt.trendRange?.length > 0 && (opt.trendRange[0] > status._regression.m || opt.trendRange[1] < status._regression.m)) {
          continue;
        }
      }

      const nmbr = this.caseUtil.getCaseNumbers(d.properties, opt);
      if (!this.caseUtil.isHoveredOrSelectedBin(opt, nmbr)) {
        continue;
      }

      const pGlyph = await this.getPreparedGlyphWithRotation(d);
      this.preparedGlyphs.push(pGlyph);
    }
  }

  protected async getPreparedGlyphWithRotation(glyphData: Feature<MultiPolygon, RKICaseDevelopmentProperties>): Promise<PreparedGlyphWithRotation> {
    const latlng = this.getLatLng(glyphData);
    const ptOrig = this._map.latLngToLayerPoint(latlng);

    const pt = new Point(ptOrig.x, ptOrig.y + this.getGlyphHeight());

    // const bounds = new Bounds(pt, new L.Point(pt.x + this.getGlyphWidth(), pt.y));

    const gl = this.prepareGlyphAdditionalFeatures(glyphData, pt);

    const status = this.caseUtil.getTimedStatusWithOptions(glyphData.properties, this.options$.value) as StatusWithCache;

    let rot$: Observable<{rotation: number; m: number; b: number}>;
    if (status?._regression?.rotation) {
      rot$ = of(status._regression);
    } else {
      rot$ = this.caseUtil.getTrendForCase7DaysPer100k(glyphData.properties, this.options$.value)
      .pipe(
        map(t => ({m: t.m, b: t.b, rotation: this.caseUtil.getRotationForTrend(t.m)})),
        tap(r => {
          if (status) {
            status._regression = {
              rotation: r.rotation,
              m: r.m,
              b: r.b
            };
          }
        })
      );
    }

    const rotation = await rot$.toPromise();

    // update bounds
    // gl.bounds = gl.bounds.extend(new Point(pt.x, pt.y - this.getGlyphHeight() - 3));
    gl.y = pt.y - this.getGlyphHeight() - 3;
    gl._y = gl.y;
    gl.width = Math.max(gl.width, this.getGlyphWidth());
    gl.height += this.getGlyphHeight() + 3;
    gl.textMarginTop = this.getGlyphHeight() + 3;

    return {...gl, rotation: rotation.rotation} as PreparedGlyphWithRotation;
  }

  /**
   * Override
   *
   * @param gl prepared glyph
   */
  protected drawPreparedGlyph(gl: PreparedGlyphWithRotation): void {
    const topLeftPt = new Point(gl.x - (this.getGlyphWidth() / 2), gl.y);
    const pt = new Point(gl.x, gl.y + (this.getGlyphHeight() / 2));

    // draw actual glyph
    this.ctx.save();

    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(topLeftPt.x, topLeftPt.y, this.getGlyphWidth(), this.getGlyphHeight());

    this.ctx.translate(pt.x, pt.y);
    this.ctx.rotate(gl.rotation * Math.PI / 180);
    this.ctx.translate(-pt.x, -pt.y);

    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2 * this.currentScale;

    this.ctx.beginPath();
    this.ctx.moveTo(topLeftPt.x, pt.y);
    this.ctx.lineTo(topLeftPt.x + this.getGlyphWidth(), pt.y);
    this.ctx.stroke();

    this.ctx.restore();

    super.drawPreparedGlyph(gl);
  }
}

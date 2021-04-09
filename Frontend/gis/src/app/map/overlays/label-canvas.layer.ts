import { Feature, FeatureCollection, Geometry } from 'geojson';
import L, { Bounds, DomUtil, LatLngLiteral, Point } from 'leaflet';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ForceLayoutProperties, HasCentroid, HasName } from 'src/app/repositories/types/out/abstract-hospital-out';
import { ForceDirectedLayout } from 'src/app/util/force-directed-layout';
import { CanvasLayer, IViewInfo } from 'src/app/util/ts-canvas-layer';
import { MyLocalStorageService } from '../../services/my-local-storage.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedBackgroundOptions } from '../options/bed-background-options';
import { CovidNumberCaseOptions } from '../options/covid-number-case-options';
import { GlyphLayer } from './GlyphLayer';

interface MyQuadTreeItem < Payload > {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: Payload;
}

// contains x,y coordinates in pixel space
// containes wrapped text
// contains actual bounds including text
export interface PreparedGlyph {
  latlng: LatLngLiteral;
  x: number;
  y: number;
  _x: number;
  _y: number;
  textMarginTop: number;
  wrappedText: {text: string; fontSize: number}[];
  width: number;
  height: number;
}

export class LabelCanvasLayer < G extends Geometry, P extends ForceLayoutProperties & HasName & HasCentroid, C extends BedBackgroundOptions | CovidNumberCaseOptions> extends CanvasLayer implements GlyphLayer {

  // protected quadtree: Quadtree < MyQuadTreeItem < Feature < G, P >>> ;

  protected visible = true;

  protected forceLayout: ForceDirectedLayout < PreparedGlyph > ;

  protected ctx: CanvasRenderingContext2D;

  protected currentScale = 1;

  protected viewInfo: IViewInfo;

  private initiallyMounted = false;

  private showText = false;

  protected preparedGlyphs: PreparedGlyph[] = [];


  constructor(
    name: string,
    protected data: FeatureCollection < G, P > ,
    protected granularity: AggregationLevel,
    protected options$: BehaviorSubject < C > ,
    protected storage: MyLocalStorageService
  ) {
    super({
      interactive: false,
      bubblingMouseEvents: false
    });

    this.forceLayout = new ForceDirectedLayout < PreparedGlyph > (this.storage, granularity);

    this.forceLayout.getEvents()
      .pipe(
        filter(e => e.type === 'end')
      )
      .subscribe(e => {
        this.preparedGlyphs = e.data;

        this.drawPreparedGlyphs();
      });
  }

  // this function is called whenever the canvas needs to redraw itself
  public onDrawLayer(options: IViewInfo) {
    this.viewInfo = options;

    // if (this.quadtree) {
    //   this.quadtree.clear();
    // }

    // this.quadtree = new Quadtree({
    //   width: options.size.x,
    //   height: options.size.y
    // });

    this.ctx = options.canvas.getContext('2d');

    this.updateCurrentScale();

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    DomUtil.setPosition(this._canvas, topLeft);

    this.ctx.translate(-topLeft.x, -topLeft.y);

    if (!this.initiallyMounted) {
      this.prepareAllGpyphs().then(() => this.drawPreparedGlyphs());
    } else {
      this.drawPreparedGlyphs();
    }
  }

  onLayerDidMount() {
    if (this.initiallyMounted) {
      return;
    }

    this._map.on('zoom', () => this.onZoomed());

    setTimeout(() => this.onZoomed(), 100);

    this.initiallyMounted = true;
  }

  protected latAcc(d: Feature < G, P > ): number {
    return d.properties.centroid.coordinates[1];
  }

  protected lngAcc(d: Feature < G, P > ): number {
    return d.properties.centroid.coordinates[0];
  }

  updateCurrentScale(): void {
    const zoom = this._map.getZoom();

    // let scale = Math.pow(9 / (zoom), 2);
    let scale = 1;

    this.showText = true;

    if (this.granularity === AggregationLevel.county) {
      if (zoom <= 7) {
        this.showText = false;
      }
      if (zoom < 8) {
        scale = Math.pow(zoom / 8, 2);
      }

      if (zoom > 10) {
        scale = Math.pow(zoom / 10, 2);
      }
    } else if (this.granularity === AggregationLevel.governmentDistrict && zoom >= 7) {
      scale = Math.pow(zoom / 7, 2);
    } else if (this.granularity === AggregationLevel.state || this.granularity === AggregationLevel.country) {
      scale = Math.pow(zoom / 5, 2);
    }

    this.currentScale = scale;
  }

  protected onZoomed() {
    if (!this._map || !this.ctx) {
      return;
    }

    this.prepareAllGpyphs()
    .then(() => {
      this.drawPreparedGlyphs();

      this.calculateOverlapFree();
    });
  }

  protected getGlyphWidth() {
    return 30 * this.currentScale;
  }

  protected getGlyphHeight() {
    return Math.round(13 * this.currentScale);
  }

  setVisibility(v: boolean) {
    if (this.visible === v) {
      return;
    }
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }

  protected getLatLng(d: Feature < G, P > ): L.LatLngLiteral {
    return {
      lat: this.latAcc(d),
      lng: this.lngAcc(d)
    };
  }

  protected getGlyphPixelPos(d: Feature < G, P > ): L.Point {
    return new Point(d.properties.x, d.properties.y);
  }


  protected clearCanvas() {
    if (!this.ctx) {
      return;
    }

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);

    // remove everything
    this.ctx.clearRect(topLeft.x, topLeft.y, this._canvas.width + Math.abs(topLeft.x), this._canvas.height + Math.abs(topLeft.y));
  }

  protected drawPreparedGlyphs() {
    if (!this.data || !this._map || !this.ctx) {
      return;
    }

    this.clearCanvas();

    for (const g of this.preparedGlyphs) {
      if (!this.viewInfo.bounds.contains(g.latlng)) {
        continue;
      }

      this.drawPreparedGlyph(g);
    }

  }

  protected drawPreparedGlyph(g: PreparedGlyph): void {
    if (this.options$.value.showLabels && this.showText && g.wrappedText && g.wrappedText.length > 0) {

      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;


      this.ctx.font = `bold ${g.wrappedText[0].fontSize}px Roboto`;
      // this.ctx.fillStyle = isHovered ? '#193e8a' : 'black';
      // this.ctx.shadowOffsetX = 1;
      // this.ctx.shadowOffsetY = 1;
      // this.ctx.shadowColor = "rgba(255,255,255,1)";
      // this.ctx.shadowBlur = 4;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';

      g.wrappedText.forEach((text, i) => {
        this.ctx.strokeText(text.text, g.x, g.y + g.textMarginTop + i * text.fontSize);
        this.ctx.fillText(text.text, g.x, g.y + g.textMarginTop + i * text.fontSize);
      });
    }
  }

  // @method bringToFront(): this
  // Brings the layer to the top of all overlays.
  bringToFront(): this {
    if (this._map) {
      DomUtil.toFront(this._canvas);
    }
    return this;
  }

  // @method bringToBack(): this
  // Brings the layer to the bottom of all overlays.
  bringToBack(): this {
    if (this._map) {
      DomUtil.toBack(this._canvas);
    }
    return this;
  }

  protected calculateOverlapFree() {
    if (!this.preparedGlyphs || !this._map || !this.ctx) {
      return;
    }

    if (!this.visible) {
      return;
    }

    //  this.ctx.strokeRect(g.x - g.width / 2, g.y, g.width, g.height);

    const cb = (d: PreparedGlyph, i: number, ds: PreparedGlyph[]) => ([
      [d.x - d.width / 2, d.y],
      [d.x + d.width / 2, d.y + d.height]]);

    this.forceLayout.update(cb as any, this.preparedGlyphs, this._map.getZoom());
  }

  /**
   * Taken from: https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
   */
  protected getWrappedText(text: string, maxWidth: number, fontSize: number): {line: string; width: number}[] {
    const words = text.split(/[ -]/g);
    let line = '';

    const lines: {line: string; width: number}[] = [];
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;


    this.ctx.font = `bold ${fontSize}px Roboto`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    let testWidth: number;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push({line, width: this.ctx.measureText(line).width});
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push({line, width: this.ctx.measureText(line).width});
    return lines;
  }

  protected prepareGlyph(inGlyph: Feature<G, P>): PreparedGlyph {
    const latlng = this.getLatLng(inGlyph);
    const pt = this._map.latLngToLayerPoint(latlng);

    return this.prepareGlyphAdditionalFeatures(inGlyph, pt);
  }

  protected prepareGlyphAdditionalFeatures(inGlyph: Feature<G, P>, pt: L.Point): PreparedGlyph {
    const centerX = pt.x;
    const belowGlyhY = pt.y;

    // empty bounds
    let bounds = new Bounds(pt, pt);

    let wrappedText: {text: string; fontSize: number}[] = [];

    if (this.options$.value.showLabels && this.showText) {
      const prefix = (inGlyph.properties as any).description;
      const text = (prefix && prefix !== 'Landkreis' && prefix !== 'Kreis' ? prefix + ' ' : '') + inGlyph.properties.name;

      const fontSizeAndHeight = Math.round(11 * this.currentScale);

      const wText = this.getWrappedText(text, this.getGlyphWidth() * 4, fontSizeAndHeight);
      const widthOfWrappedText = wText.map(m => m.width).reduce((agg, val) => Math.max(agg || 0, val));

      wrappedText = wText.map((w, i) => ({text: w.line, fontSize: fontSizeAndHeight}));


      const heightOfWrappedText = belowGlyhY + fontSizeAndHeight * wrappedText.length;

      // const b = new Bounds(
      //   new Point(centerX, belowGlyhY),
      //   new Point(centerX + widthOfWrappedText, heightOfWrappedText)
      // );

      const topLeftPt = new Point(centerX - (widthOfWrappedText / 2), belowGlyhY);
      const bottomRightPt = new Point(centerX + (widthOfWrappedText / 2), heightOfWrappedText);
      bounds = new Bounds(topLeftPt, bottomRightPt);
    }

    return {
      latlng: this.getLatLng(inGlyph),
      x: pt.x,
      y: pt.y,
      _x: pt.x,
      _y: pt.y,
      wrappedText,
      textMarginTop: 0,
      width: bounds.getSize().x,
      height: bounds.getSize().y,
    };
  }

  protected async prepareAllGpyphs(): Promise<void> {
    if (!this._map || !this.data || !this.ctx) {
      return;
    }

    // required so that the showText attribute is properly set
    this.updateCurrentScale();

    this.preparedGlyphs = this.data.features.map(d => this.prepareGlyph(d));
  }

}

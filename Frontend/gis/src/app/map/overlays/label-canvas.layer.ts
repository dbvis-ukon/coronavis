import { Feature, FeatureCollection, Geometry } from 'geojson';
import L, { Bounds, DomUtil, Point } from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage/public_api';
import * as Quadtree from 'quadtree-lib';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ForceLayoutProperties, HasCentroid, HasName } from 'src/app/repositories/types/out/abstract-hospital-out';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { CanvasLayer, IViewInfo } from 'src/app/util/ts-canvas-layer';
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

export class LabelCanvasLayer < G extends Geometry, P extends ForceLayoutProperties & HasName & HasCentroid, C extends BedBackgroundOptions | CovidNumberCaseOptions> extends CanvasLayer implements GlyphLayer {

  protected quadtree: Quadtree < MyQuadTreeItem < Feature < G, P >>> ;

  protected visible = true;

  protected forceLayout: ForceDirectedLayout < G, P > ;

  protected ctx: CanvasRenderingContext2D;

  protected currentScale = 1;

  protected viewInfo: IViewInfo;

  private initiallyMounted = false;

  private showText = false;


  constructor(
    name: string,
    protected data: FeatureCollection < G, P > ,
    protected granularity: AggregationLevel,
    protected options$: BehaviorSubject < C > ,
    protected storage: LocalStorageService
  ) {
    super({
      interactive: false,
      bubblingMouseEvents: false
    });

    this.forceLayout = new ForceDirectedLayout < G, P > (this.storage, granularity);


    this.forceLayout.getEvents()
      .pipe(
        filter(e => e.type === 'end')
      )
      .subscribe(e => {
        this.data = e.data;

        this.drawLabels();
      });
  }

  // this function is called whenever the canvas needs to redraw itself
  public onDrawLayer(options: IViewInfo) {
    this.viewInfo = options;

    if (this.quadtree) {
      this.quadtree.clear();
    }

    this.quadtree = new Quadtree({
      width: options.size.x,
      height: options.size.y
    });

    this.ctx = options.canvas.getContext('2d');

    this.updateCurrentScale();

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    DomUtil.setPosition(this._canvas, topLeft);

    this.ctx.translate(-topLeft.x, -topLeft.y);

    this.drawLabels();
  }

  onLayerDidMount() {
    if (this.initiallyMounted) {
      return;
    }

    this._map.on('zoom', () => this.onZoomed());

    this.onZoomed();

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

  protected drawAdditionalFeatures(data: Feature<G, P>, pt: L.Point) {
    let bounds = new Bounds(pt, pt);

    if (this.options$.value.showLabels && this.showText) {
      const prefix = (data.properties as any).description;
      const b = this.drawText((prefix && prefix !== 'Landkreis' && prefix !== 'Kreis' ? prefix + ' ' : '') + data.properties.name, pt, 0, false);

      bounds = bounds
        .extend(b.min)
        .extend(b.max);
    }

    return bounds;
  }

  protected onZoomed() {
    if (!this._map) {
      return;
    }

    this.calculateOverlapFree();
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

  protected drawLabels() {
    if (!this.data || !this._map || !this.ctx) {
      return;
    }

    this.clearCanvas();

    for (const g of this.data.features) {
      const latLng = this.getLatLng(g);

      if (!this.viewInfo.bounds.contains(latLng)) {
        continue;
      }

      this.drawLabel(g);
    }

  }

  protected drawLabel(glyphData: Feature < G, P > ) {
    const pt = this.getGlyphPixelPos(glyphData);

    let bounds = new Bounds(pt, new Point(pt.x + this.getGlyphWidth(), pt.y));

    const boundsAdd = this.drawAdditionalFeatures(glyphData, pt);

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
    if (!this.data || !this._map) {
      return;
    }

    this.updateCurrentScale();

    // update glyph positions because they are based on the zoom level
    this.data.features.forEach(d => {
      const pt = this._map.latLngToLayerPoint(this.getLatLng(d));
      // const pt = this.latLngPoint(this.getLatLng(d));
      d.properties._x = pt.x;
      d.properties.x = pt.x;

      d.properties._y = pt.y;
      d.properties.y = pt.y;
    });

    if (!this.visible) {
      return;
    }

    const glyphBoxes = [
      [-this.getGlyphWidth() / 2, -this.getGlyphHeight() / 2],
      [this.getGlyphWidth() / 2, this.getGlyphHeight() / 2]
    ];

    this.forceLayout.update(glyphBoxes, this.data, this._map.getZoom());
  }

  /**
   * Taken from: https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
   * @param text
   * @param maxWidth
   */
  protected getWrappedText(text: string, maxWidth: number): {line: string; width: number}[] {
    const words = text.split(' ');
    let line = '';

    const lines: {line: string; width: number}[] = [];

    let testWidth;
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

  // returns height of this wrapped text
  protected drawText(text: string, pt: L.Point, yOffset: number, isHovered: boolean): Bounds {
    // this.ctx.save();

    const centerX = pt.x;
    const belowGlyhY = pt.y;

    const fontSizeAndHeight = Math.round(11 * this.currentScale);

    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;


    this.ctx.font = `bold ${fontSizeAndHeight}px Roboto`;
    this.ctx.fillStyle = isHovered ? '#193e8a' : 'black';
    // this.ctx.shadowOffsetX = 1;
    // this.ctx.shadowOffsetY = 1;
    // this.ctx.shadowColor = "rgba(255,255,255,1)";
    // this.ctx.shadowBlur = 4;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    const lineHeight = fontSizeAndHeight;
    const wrappedText = this.getWrappedText(text, this.getGlyphWidth() * 4);

    for (let i = 0; i < wrappedText.length; i++) {
      this.ctx.strokeText(wrappedText[i].line, centerX, belowGlyhY + i * lineHeight);
      this.ctx.fillText(wrappedText[i].line, centerX, belowGlyhY + i * lineHeight);
    }

    const maxWidth = wrappedText.map(m => m.width).reduce((agg, val) => Math.max(agg || 0, val));

    // this.ctx.restore();

    return new Bounds(
      new Point(centerX - (maxWidth / 2), belowGlyhY),
      new Point(centerX + (maxWidth / 2), belowGlyhY + lineHeight * wrappedText.length)
    );
  }

}

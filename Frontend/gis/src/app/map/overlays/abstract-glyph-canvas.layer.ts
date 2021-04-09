import { MatDialog } from '@angular/material/dialog/dialog';
import { Selection } from 'd3-selection';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import L, { Bounds, DomUtil, LeafletMouseEvent, Point } from 'leaflet';
import * as Quadtree from 'quadtree-lib';
import { BehaviorSubject, NEVER, Observable, Subject, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { CanvasLayer, IViewInfo } from 'src/app/util/ts-canvas-layer';
import { MyLocalStorageService } from '../../services/my-local-storage.service';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { GlyphLayer } from './GlyphLayer';

interface MyQuadTreeItem < Payload > {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: Payload;
}

interface GlyphEvent < G extends Geometry, T extends SingleHospitalOut < QualitativeTimedStatus > | AggregatedHospitalOut < QualitativeTimedStatus >> {
  mouse: LeafletMouseEvent;

  item: Feature < G,
  T > ;
}

export abstract class AbstractGlyphCanvasLayer < G extends Geometry, T extends SingleHospitalOut < QualitativeTimedStatus > | AggregatedHospitalOut < QualitativeTimedStatus >> extends CanvasLayer implements GlyphLayer {

  protected quadtree: Quadtree < MyQuadTreeItem < Feature < G, T >>> ;

  protected visible = false;

  protected forceLayout: ForceDirectedLayout < G, T > ;

  protected svgSelection: Selection < SVGSVGElement, unknown, null, undefined > ;

  protected oldOptions: BedGlyphOptions = null;

  protected currentOptions: BedGlyphOptions = null;

  protected rectSize = 10;

  protected rectPadding = 0.5;

  protected rectYOffset = 3;

  protected ctx: CanvasRenderingContext2D;

  protected currentScale = 1;

  protected viewInfo: IViewInfo;

  protected mouseMove$: Subject < LeafletMouseEvent > = new Subject();

  protected click$: Subject < LeafletMouseEvent > = new Subject();

  private initiallyMounted = false;

  protected currentlyHoveredGlyph: Feature<G, T>;


  constructor(
    name: string,
    protected data: FeatureCollection < G, T > ,
    protected granularity: AggregationLevel,
    protected tooltipService: TooltipService,
    protected colormapService: QualitativeColormapService,
    protected glyphOptions$: BehaviorSubject < BedGlyphOptions > ,
    protected dialog: MatDialog,
    protected storage: MyLocalStorageService
  ) {
    super({
      interactive: true,
      bubblingMouseEvents: true
    });

    this.forceLayout = new ForceDirectedLayout < G, T > (this.storage, granularity);

    this.currentOptions = this.glyphOptions$.value;
    this.oldOptions = this.glyphOptions$.value;

    this.glyphOptions$
      .pipe(
        switchMap(opt => {
          this.currentOptions = opt;

          if (!this.ctx || !opt) {
            return NEVER;
          }

          if (this.oldOptions?.showIcuLow !== opt.showIcuLow) {
            this.drawGlyphs();
          }

          if (this.oldOptions?.showIcuHigh !== opt.showIcuHigh) {
            this.drawGlyphs();
          }

          if (this.oldOptions?.showEcmo !== opt.showEcmo) {
            this.drawGlyphs();
          }

          if (this.oldOptions?.forceDirectedOn !== opt.forceDirectedOn) {
            this.calculateOverlapFree();
          }

          if (this.oldOptions?.date !== opt.date) {
            timer(10)
            .subscribe(() => this.drawGlyphs());
          }



          this.oldOptions = JSON.parse(JSON.stringify(opt));

          return NEVER;
        })
      )
      .subscribe();


    this.onMouseMove()
      .subscribe(e => {
        if (e === null) {
          this.tooltipService.close();
          DomUtil.removeClass(this._canvas, 'glyphHit');
          this.drawGlyphs();
          return;
        }

        DomUtil.addClass(this._canvas, 'glyphHit');

        const t = this.tooltipService.openAtElementRef(GlyphTooltipComponent, {
          x: e.mouse.originalEvent.clientX + 5,
          y: e.mouse.originalEvent.clientY + 5
        });
        t.tooltipData = e.item.properties;
        t.options = this.currentOptions;


        this.drawGlyphs();
      });

    this.onClick()
      .subscribe(e => {
        this.tooltipService.close();

        if (!e) {
          return;
        }

        this.dialog.open(HospitalInfoDialogComponent, {
          data: {
            data: e.item.properties,
            options: this.currentOptions
          }
        });
      });


    this.forceLayout.getEvents()
      .subscribe(e => {
        this.data = e.data;

        this.drawGlyphs();
      });
  }

  // this function is called whenever the canvas needs to redraw itself
  public onDrawLayer(options: IViewInfo) {
    this.viewInfo = options;

    if (this.quadtree) {
      this.quadtree.clear();
    }

    if (options.size.x > 1 && options.size.y > 1) {
      this.quadtree = new Quadtree({
        width: options.size.x,
        height: options.size.y
      });
    }

    this.ctx = options.canvas.getContext('2d');

    this.updateCurrentScale();

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    DomUtil.setPosition(this._canvas, topLeft);

    this.ctx.translate(-topLeft.x, -topLeft.y);

    this.drawGlyphs();
  }

  onLayerDidMount() {
    if (this.initiallyMounted) {
      return;
    }

    this._map.on('zoom', () => this.onZoomed());

    this.on('mousemove', (e: LeafletMouseEvent) => this.mouseMove$.next(e));

    this.on('click', (e: LeafletMouseEvent) => this.click$.next(e));

    this.onZoomed();

    this.initiallyMounted = true;
  }

  protected abstract latAcc(d: Feature < G, T > ): number;

  protected abstract lngAcc(d: Feature < G, T > ): number;

  protected abstract updateCurrentScale(): void;

  protected abstract drawAdditionalFeatures(data: Feature < G, T > , pt: Point, isHovered: boolean): Bounds;

  protected onZoomed() {
    if (!this._map) {
      return;
    }

    this.calculateOverlapFree();
  }

  protected getGlyphWidth() {
    return (3 * this.rectSize + 4 * this.rectPadding) * this.currentScale;
  }

  protected getGlyphHeight() {
    return (this.rectSize + 2 * this.rectPadding) * this.currentScale;
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

  protected getLatLng(d: Feature < G, T > ): L.LatLngLiteral {
    return {
      lat: this.latAcc(d),
      lng: this.lngAcc(d)
    };
  }

  protected getGlyphPixelPos(d: Feature < G, T > ): L.Point {
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

  protected drawGlyphs() {
    if (!this.data || !this._map || !this.ctx) {
      return;
    }

    this.clearCanvas();

    for (const g of this.data.features) {
      const latLng = this.getLatLng(g);

      if (!this.viewInfo.bounds.contains(latLng)) {
        continue;
      }

      this.drawGlyph(g);
    }

    // draw hovered glyph again so it's on top
    if (this.currentlyHoveredGlyph) {
      this.drawGlyph(this.currentlyHoveredGlyph);
    }
  }

  protected drawGlyph(glyphData: Feature < G, T > ) {
    const isCurrentlyHovered = this.currentlyHoveredGlyph === glyphData;

    const pt = this.getGlyphPixelPos(glyphData);

    let bounds = this.drawGlyphRects(glyphData, pt, isCurrentlyHovered);

    const boundsAdd = this.drawAdditionalFeatures(glyphData, pt, isCurrentlyHovered);

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

  protected drawGlyphRects(glyphData: Feature < G, T > , pt: Point, isHovered: boolean): Bounds {
    const width = this.getGlyphWidth();
    const height = this.getGlyphHeight();

    const hoveredBounds = isHovered ? 3 : 0;

    // white background
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(pt.x - hoveredBounds, pt.y - hoveredBounds, width + hoveredBounds * 2, height + hoveredBounds * 2);

    if (this.currentOptions.showIcuLow) {
      this.drawGlyphRect(pt, glyphData, BedType.icuLow, 0);
    }
    if (this.currentOptions.showIcuHigh) {
      this.drawGlyphRect(pt, glyphData, BedType.icuHigh, 1);
    }
    if (this.currentOptions.showEcmo) {
      this.drawGlyphRect(pt, glyphData, BedType.ecmo, 2);
    }

    return new Bounds(pt, new Point(pt.x + width, pt.y + height));
  }

  protected drawGlyphRect(glyphPos: Point, glyphData: Feature < G, T > , bedType: BedType, idx: number) {
    const xPos = (this.rectPadding + idx * this.rectSize + idx * this.rectPadding) * this.currentScale;
    const yPos = (this.rectPadding) * this.currentScale;

    this.ctx.fillStyle = this.colormapService.getLatestBedStatusColor(glyphData.properties, bedType, this.currentOptions?.date);
    this.ctx.fillRect(glyphPos.x + xPos, glyphPos.y + yPos, this.rectSize * this.currentScale, this.rectSize * this.currentScale);
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
    if (!this.data || !this._map || !this.currentOptions) {
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

    if (!this.currentOptions.forceDirectedOn || !this.visible) {
      return;
    }

    const glyphBoxes: [[number, number], [number, number]] = [
      [-this.getGlyphWidth() / 2, -this.getGlyphHeight() / 2],
      [this.getGlyphWidth() / 2, this.getGlyphHeight() / 2]
    ];

    this.forceLayout.update(glyphBoxes, this.data, this._map.getZoom());
  }

  /**
   * Taken from: https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
   */
  protected getWrappedText(text: string, maxWidth: number): {line: string; width: number}[] {
    const words = text.split(' ');
    let line = '';

    const lines: {line: string; width: number}[] = [];

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

  protected findItem(e: LeafletMouseEvent): Feature < G, T > | null {
    if (!this.quadtree) {
      return null;
    }

    const items = this.quadtree.colliding({
      x: e.layerPoint.x - 5,
      y: e.layerPoint.y - 5,
      width: 10,
      height: 10
    });
    if (items && items.length > 0) {
      return items[0].payload;
    }

    return null;
  }

  protected onMouseMove(): Observable < GlyphEvent < G, T > | null > {
    return this.mouseMove$
      .pipe(
        filter(e => {
          const map1 = this._map as any;

          const touches = (e.originalEvent as any).touches;

          if ((e.originalEvent as any).triggeredByTouch || touches?.lenght > 1 || !map1 || map1.dragging.moving() || map1._animatingZoom) {
            return false;
          }

          return true;
        }),
        map(e => {
          const item = this.findItem(e);
          if (!item) {
            return null;
          }
          return {
            mouse: e,
            item
          };
        }),
        distinctUntilChanged((x, y) => x?.item === y?.item),
        tap(d => this.currentlyHoveredGlyph = d?.item)
      );
  }

  protected onClick(): Observable < GlyphEvent < G, T > | null > {
    return this.click$
      .pipe(
        map(e => {
          const item = this.findItem(e);
          if (!item) {
            return null;
          }
          return {
            mouse: e,
            item
          };
        }),
      );
  }

  // returns height of this wrapped text
  protected drawText(text: string, pt: L.Point, yOffset: number, isHovered: boolean): Bounds {
    this.ctx.save();

    const centerX = pt.x + (this.getGlyphWidth() / 2);
    const belowGlyhY = pt.y + this.getGlyphHeight() + this.rectYOffset + yOffset;

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

    this.ctx.restore();

    return new Bounds(
      new Point(centerX - (maxWidth / 2), belowGlyhY),
      new Point(centerX + (maxWidth / 2), belowGlyhY + lineHeight * wrappedText.length)
    );
  }

}

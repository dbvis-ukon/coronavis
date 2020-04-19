import { MatDialog } from '@angular/material/dialog/dialog';
import { Selection } from 'd3-selection';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import L, { DomUtil, LeafletMouseEvent, Point } from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage/public_api';
import * as Quadtree from 'quadtree-lib';
import { BehaviorSubject, NEVER, Observable, Subject, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { CanvasLayer, IViewInfo } from 'src/app/util/ts-canvas-layer';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { GlyphLayer } from './GlyphLayer';

export interface MyQuadTreeItem<Payload> {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: Payload;
}

export interface GlyphEvent<G extends Geometry, T extends SingleHospitalOut < QualitativeTimedStatus > | AggregatedHospitalOut < QualitativeTimedStatus >> {
  mouse: LeafletMouseEvent;

  item: Feature<G, T>;
}

export abstract class AbstractGlyphCanvasLayer < G extends Geometry, T extends SingleHospitalOut < QualitativeTimedStatus > | AggregatedHospitalOut < QualitativeTimedStatus >> extends CanvasLayer implements GlyphLayer {

  protected quadtree: Quadtree<MyQuadTreeItem<Feature<G, T>>>;

  protected visible: boolean = false;

  protected gHospitals: Selection < SVGGElement, Feature < G, T > , SVGSVGElement, unknown > ;

  protected forceLayout: ForceDirectedLayout;

  protected svgSelection: Selection < SVGSVGElement, unknown, null, undefined > ;

  protected oldOptions: BedGlyphOptions = null;

  protected currentOptions: BedGlyphOptions = null;

  protected rectSize = 10;

  protected rectPadding = 0.5;

  protected rectYOffset = 3;

  protected ctx: CanvasRenderingContext2D;

  protected currentScale: number = 1;

  protected viewInfo: IViewInfo;

  protected mouseMove$: Subject<LeafletMouseEvent> = new Subject();

  protected click$: Subject<LeafletMouseEvent> = new Subject();


  constructor(
    name: string,
    protected data: FeatureCollection < G, T >,
    protected granularity: AggregationLevel,
    protected tooltipService: TooltipService,
    protected colormapService: QualitativeColormapService,
    protected glyphOptions$: BehaviorSubject<BedGlyphOptions>,
    protected dialog: MatDialog,
    protected storage: LocalStorageService
  ) {
    super({
      interactive: true,
      bubblingMouseEvents: true
    });
    
    this.forceLayout = new ForceDirectedLayout(this.storage, this.data as any, granularity, this.updateGlyphPositions.bind(this));

    this.currentOptions = this.glyphOptions$.value;

    this.glyphOptions$
    .pipe(
      debounceTime(10),
      switchMap(opt => {
        this.currentOptions = opt;
        if (!this.gHospitals || !opt) {
          return NEVER;
        }
  
        if(this.oldOptions?.showIcuLow !== opt.showIcuLow) {
          this.drawGlyphs();
        }
        
        if(this.oldOptions?.showIcuHigh !== opt.showIcuHigh) {
          this.drawGlyphs();
        }
  
        if(this.oldOptions?.showEcmo !== opt.showEcmo) {
          this.drawGlyphs();
        }

        if(this.oldOptions?.forceDirectedOn !== opt.forceDirectedOn) {
          this.calculateOverlapFree();
        }
  
        if(this.oldOptions?.date !== opt.date) {
          timer(1)
          .subscribe(() => {
            this.drawGlyphs();
          })
          
        }
        
  
  
        this.oldOptions = JSON.parse(JSON.stringify(opt));

        return NEVER;
      })
    )    
    .subscribe();


    this.onMouseMove()
    .subscribe(e => {
      if(e === null) {
        this.tooltipService.close();
        DomUtil.removeClass(this._canvas, 'glyphHit');
        return;
      }

      DomUtil.addClass(this._canvas, 'glyphHit');

      const t = this.tooltipService.openAtElementRef(GlyphTooltipComponent, {
        x: e.mouse.originalEvent.clientX + 5,
        y: e.mouse.originalEvent.clientY + 5
      });
      t.tooltipData = e.item.properties;

      
    });

    this.onClick()
    .subscribe(e => {
      this.tooltipService.close();

      if(!e) {
        return;
      }

      this.dialog.open(HospitalInfoDialogComponent, {
        data: e.item.properties
      });
    });
  }

  // this function is called whenever the canvas needs to redraw itself
  public onDrawLayer(options: IViewInfo) {
    this.viewInfo = options;

    this.quadtree = new Quadtree({width: options.size.x, height: options.size.y});

    this.ctx = options.canvas.getContext('2d');

    this.clearCanvas();

    this.updateCurrentScale();

    const topLeft = this._map.containerPointToLayerPoint([0, 0])
    DomUtil.setPosition(this._canvas, topLeft)

    this.drawGlyphs();
  }

  onLayerDidMount() {
    this._map.on('zoom', () => this.onZoomed());

    this.on('mousemove', (e: LeafletMouseEvent) => this.mouseMove$.next(e));

    this.on('click', (e: LeafletMouseEvent) => this.click$.next(e));

    this.onZoomed();
  }

  protected abstract latAcc(d: Feature < G, T > ): number;

  protected abstract lngAcc(d: Feature < G, T > ): number;

  protected abstract updateCurrentScale(): void;

  protected abstract drawAdditionalFeatures(data: Feature<G, T>, pt: Point);

  protected onZoomed() {
    if(!this._map) {
      return;
    }
    // update glyph positions because they are based on the zoom level
    this.data.features.forEach(d => {
      const pt = this._map.latLngToLayerPoint(this.getLatLng(d));
      // const pt = this.latLngPoint(this.getLatLng(d));
      d.properties._x = pt.x;
      d.properties.x = pt.x;

      d.properties._y = pt.y;
      d.properties.y = pt.y;
    });
    
    this.calculateOverlapFree();
  }

  protected getGlyphWidth() {
    return (3 * this.rectSize + 4 * this.rectPadding) * this.currentScale;
  }

  protected getGlyphHeight() {
    return (this.rectSize + 2 * this.rectPadding) * this.currentScale;
  }

  protected getTransformPixelPosition(p: L.Point): L.Point {
    return p;
  }

  setVisibility(v: boolean) {
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }

  protected getLatLng(d: Feature<G , T>): L.LatLngLiteral {
    return {lat: this.latAcc(d), lng: this.lngAcc(d)};
  }

  protected getGlyphPixelPos(d: Feature<G, T>): L.Point {
    return new Point(d.properties.x, d.properties.y);
  }


  protected clearCanvas() {
    if(!this.ctx) {
      return;
    }
    // remove everything
    this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }


  protected updateGlyphPositions() {
    if(!this.ctx) {
      return;
    }
    
    this.clearCanvas();

    this.drawGlyphs();
  }

  protected drawGlyphs() {
    if(!this.data || !this._map) {
      return;
    }

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    this.ctx.translate(-topLeft.x, -topLeft.y);

    for(const g of this.data.features) {
      const latLng = this.getLatLng(g);

      if(!this.viewInfo.bounds.contains(latLng)) {
        continue;
      }

      this.drawGlyph(g);
    }
  }

  protected drawGlyph(glyphData: Feature<G, T>) {
    const pt = this.getGlyphPixelPos(glyphData);

    this.quadtree.push({
      x: pt.x,      //Mandatory
      y: pt.y,      //Mandatory
      width: this.getGlyphWidth(),   //Optional, defaults to 1
      height: this.getGlyphHeight(),   //Optional, defaults to 1
      payload: glyphData
    }) //Optional, defaults to false
    
    this.drawGlyphRects(glyphData, pt);

    this.drawAdditionalFeatures(glyphData, pt);
  }

  protected drawGlyphRects(glyphData: Feature<G, T>, pt: Point) {
    const width = this.getGlyphWidth();
    const height = this.getGlyphHeight();

    // white background
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(pt.x, pt.y, width, height);

    if(this.currentOptions.showIcuLow) {
      this.drawGlyphRect(pt, glyphData, BedType.icuLow, 0);
    }
    if(this.currentOptions.showIcuHigh) {
      this.drawGlyphRect(pt, glyphData, BedType.icuHigh, 1);
    }
    if(this.currentOptions.showEcmo) {
      this.drawGlyphRect(pt, glyphData, BedType.ecmo, 2);
    }
  }

  protected drawGlyphRect(glyphPos: Point, glyphData: Feature<G, T>, bedType: BedType, idx: number) {
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
    if(!this.currentOptions.forceDirectedOn || !this._map) {
      return;
    }

    const glyphBoxes = [[-this.getGlyphWidth() / 2, -this.getGlyphHeight() / 2], [this.getGlyphWidth() / 2, this.getGlyphHeight() / 2]];

    console.log('calculate overlap free for', this._map.getZoom(), glyphBoxes)

    timer(1)
    .subscribe(() => this.forceLayout.update(glyphBoxes, this._map.getZoom()));
  }

  /**
   * Taken from: https://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
   * @param text 
   * @param maxWidth 
   */
  protected getWrappedText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    let line = '';

    const lines: string[] = [];

    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = this.ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      }
      else {
        line = testLine;
      }
    }
    lines.push(line);
    return lines;
  }

  protected findItem(e: LeafletMouseEvent): Feature<G, T> | null {
    if(!this.quadtree) {
      return null;
    }

    const items = this.quadtree.colliding({x: e.layerPoint.x - 2, y: e.layerPoint.y - 2, width: 4, height: 4});
    if(items && items.length > 0) {
      return items[0].payload;
    }

    return null;
  }

  protected onMouseMove(): Observable<GlyphEvent<G, T> | null> {
    return this.mouseMove$
    .pipe(
      map(e => {
        const item = this.findItem(e);
        if(!item) {
          return null
        }
        return {mouse: e, item};
      }),
      distinctUntilChanged((x, y) => x?.item === y?.item)
    )
  }

  protected onClick(): Observable<GlyphEvent<G, T> | null> {
    return this.click$
    .pipe(
      map(e => {
        const item = this.findItem(e);
        if(!item) {
          return null
        }
        return {mouse: e, item};
      }),
    )
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

}
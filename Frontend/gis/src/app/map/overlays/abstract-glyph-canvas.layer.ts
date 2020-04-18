import { MatDialog } from '@angular/material/dialog/dialog';
import { Selection } from 'd3-selection';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import L, { DomUtil, Point } from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage/public_api';
import { BehaviorSubject, NEVER, timer } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { CanvasLayer, IViewInfo, Map } from 'src/app/util/ts-canvas-layer';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { GlyphLayer } from './GlyphLayer';

export abstract class AbstractGlyphCanvasLayer < G extends Geometry, T extends SingleHospitalOut < QualitativeTimedStatus > | AggregatedHospitalOut < QualitativeTimedStatus >> extends CanvasLayer implements GlyphLayer {
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
    super(null);

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
  }

  public onAdd(map: Map) {
    super.onAdd(map);

    this._map.on('zoom', () => this.onZoomed());

    this.onZoomed();
    
    return this;
  }

  // this function is called whenever the canvas needs to redraw itself
  public onDrawLayer(options: IViewInfo) {
    this.viewInfo = options;
    this.ctx = options.canvas.getContext('2d');

    this.clearCanvas();

    this.updateCurrentScale();

    const topLeft = this._map.containerPointToLayerPoint([0, 0])
    DomUtil.setPosition(this._canvas, topLeft)

    this.drawGlyphs();
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

    this.ctx.fillStyle = this.colormapService.getLatestBedStatusColor(glyphData.properties.developments, bedType, this.currentOptions?.date);
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

}
import { MatDialog } from '@angular/material/dialog/dialog';
import { event as currentEvent } from 'd3';
import { extent } from 'd3-array';
import { select, Selection } from 'd3-selection';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import { LocalStorageService } from 'ngx-webstorage/public_api';
import { NEVER, timer } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { debounceTime, switchMap } from 'rxjs/operators';
import { GlyphTooltipComponent } from 'src/app/glyph-tooltip/glyph-tooltip.component';
import { HospitalInfoDialogComponent } from 'src/app/hospital-info-dialog/hospital-info-dialog.component';
import { AbstractTimedStatus, QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';
import { AbstractHospitalOut } from 'src/app/repositories/types/out/abstract-hospital-out';
import { AggregatedHospitalOut } from 'src/app/repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';
import { QualitativeColormapService } from 'src/app/services/qualitative-colormap.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { ForceDirectedLayout } from 'src/app/util/forceDirectedLayout';
import { AggregationLevel } from '../options/aggregation-level.enum';
import { BedGlyphOptions } from '../options/bed-glyph-options';
import { BedType } from '../options/bed-type.enum';
import { GlyphLayer } from './GlyphLayer';
import { Overlay } from './overlay';

export abstract class AbstractGlyphLayer < G extends Geometry, T extends SingleHospitalOut < QualitativeTimedStatus > | AggregatedHospitalOut < QualitativeTimedStatus >> extends Overlay < T > implements GlyphLayer {
  protected visible: boolean = false;

  protected map: L.Map;

  protected gHospitals: Selection < SVGGElement, Feature < G, T > , SVGSVGElement, unknown > ;

  protected forceLayout: ForceDirectedLayout;

  protected svgSelection: Selection < SVGSVGElement, unknown, null, undefined > ;

  protected oldOptions: BedGlyphOptions = null;

  protected currentOptions: BedGlyphOptions = null;

  protected rectSize = 10;

  protected rectPadding = 0.5;

  protected rectYOffset = 0.5;

  protected glyphSize = {
    width: 38,
    height: 28
  };


  constructor(
    name: string,
    protected data: FeatureCollection < G, T >,
    protected granularity: AggregationLevel,
    protected tooltipService: TooltipService,
    protected colormapService: QualitativeColormapService,
    protected forceEnabled: boolean,
    protected glyphOptions$: Observable<BedGlyphOptions>,
    protected dialog: MatDialog,
    protected storage: LocalStorageService
  ) {
    super(name, data);

    if (this.forceEnabled) {
      this.forceLayout = new ForceDirectedLayout(this.storage, this.data as any, granularity, this.updateGlyphPositions.bind(this));
    }

    this.glyphOptions$
    .pipe(
      debounceTime(10),
      switchMap(opt => {
        this.currentOptions = opt;
        if (!this.gHospitals || !opt) {
          return NEVER;
        }
  
        if(this.oldOptions?.showIcuLow !== opt.showIcuLow) {
          this.gHospitals
            .selectAll(`.bed.${BedType.icuLow}`)
            .style('opacity', opt.showIcuLow ? '1' : '0');
        }
        
        if(this.oldOptions?.showIcuHigh !== opt.showIcuHigh) {
          this.gHospitals
            .selectAll(`.bed.${BedType.icuHigh}`)
            .style('opacity', opt.showIcuHigh ? '1' : '0');
        }
  
        if(this.oldOptions?.showEcmo !== opt.showEcmo) {
          this.gHospitals
            .selectAll(`.bed.${BedType.ecmo}`)
            .style('opacity', opt.showEcmo ? '1' : '0');
        }
  
        if(this.oldOptions?.date !== opt.date) {
          timer(1)
          .subscribe(() => {
            this.gHospitals
            .selectAll(`.bed`)
            .style('fill', (d: Feature<Geometry, AbstractHospitalOut<AbstractTimedStatus>>, i, n) => {
              const bedType = select(n[i]).attr('data-bedtype') as BedType;
              return this.colormapService.getLatestBedStatusColor(d.properties.developments as any, bedType, opt.date);
            });
          })
          
          // timer(10)
          //   .subscribe(() => {
          //     let filteredData;
          //     if(opt.date === 'now') {
          //       filteredData = this.data.features;
          //     } else {
          //       const date = moment(opt.date).endOf('day').toDate();
      
          //       console.log('filter data by date', date);
      
          //       // this.filteredData = this.data.features.filter(d => new Date(d.properties.developments[0].timestamp) <= date);
          //       filteredData = this.data.features;
          //     }
    
          //     console.log('fcmp', filteredData.length, this.data.features.length);
      
          //     this.updateGlyphs(filteredData);
          //   })
        }
        
  
  
        this.oldOptions = JSON.parse(JSON.stringify(opt));

        return NEVER;
      })
    )    
    .subscribe();
  }

  abstract latAcc(d: Feature < G, T > ): number;

  abstract lngAcc(d: Feature < G, T > ): number;

  abstract onZoomed(): void;

  createOverlay(map: L.Map) {
    this.map = map;
    
    const bounds = this.getBounds();
    const svgElement = this.initSVGSVGElement(bounds);

    
    this.updateGlyphs(this.data.features);

    // why 2 times? why? WHY? WHYYYYYYYYYYYY?
    this.updateGlyphs(this.data.features);

    this.map.on('zoom', () => this.onZoomed());

    return L.svgOverlay(svgElement, bounds, {
      interactive: true,
      bubblingMouseEvents: true,
      zIndex: 3
    });
  }

  getTransformPixelPosition(p: L.Point): L.Point {
    return p;
  }


  setVisibility(v: boolean) {
    this.visible = v;

    if (this.visible) {
      this.onZoomed();
    }
  }

  latLngPoint(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, 9);
  }

  getBounds(): L.LatLngBounds {
    const latExtent = extent(this.data.features, i => this.latAcc(i));
    const lngExtent = extent(this.data.features, i => this.lngAcc(i));

    let latLngBounds = new L.LatLngBounds([latExtent[0], lngExtent[0]], [latExtent[1], lngExtent[1]]);

    latLngBounds = latLngBounds.pad(10);

    return latLngBounds;
  }

  initSVGSVGElement(latLngBounds: L.LatLngBounds): SVGSVGElement {
    const lpMin = this.latLngPoint(latLngBounds.getSouthWest());
    const lpMax = this.latLngPoint(latLngBounds.getNorthEast());

    // just to make everything bulletproof
    const [xMin, xMax] = extent([lpMin.x, lpMax.x]);
    const [yMin, yMax] = extent([lpMin.y, lpMax.y]);

    const svgElement: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);


    this.svgSelection = select(svgElement)
      .style('pointer-events', 'none');

    return svgElement;
  }


  updateGlyphPositions() {
    this.gHospitals
      .transition().duration(500)
      .attr('transform', (d, i) => {
        const pt = this.getTransformPixelPosition({x: d.properties.x, y: d.properties.y} as L.Point);
        return `translate(${pt.x},${pt.y})`;
      });
  }


  onMouseEnter(d: Feature < G, T > , i: number, n: SVGElement[] | ArrayLike < SVGElement > ): SVGElement {
    const currentElement = n[i];
    const evt: MouseEvent = currentEvent;

    const t = this.tooltipService.openAtElementRef(GlyphTooltipComponent, {
      x: evt.clientX + 5,
      y: evt.clientY + 5
    });
    t.tooltipData = d.properties;

    select(currentElement).raise();

    return currentElement;
  }

  onMouseLeave(): void {
    this.tooltipService.close();
  }

  onClick(d: Feature < G, T > ): void {
    this.tooltipService.close();
    this.dialog.open(HospitalInfoDialogComponent, {
      data: d.properties
    });
  }

  updateGlyphs(data: Feature<G, T>[]) {
    this.updateGlyphG(data);

    const container = this.appendGlyphContainer();
    
    this.appendBackgroundRect(container);
    
    this.appendText(container);
    
    this.appendGlyphRects(container);

    this.onZoomed();
  }

  updateGlyphG(data: Feature < G, T > []) {
    this.gHospitals =

      this.svgSelection
      .selectAll < SVGGElement, Feature < G, T >> ('g.hospital')
      .data < Feature < G, T >> (data, d => d.properties.name);

    this.gHospitals
      .enter()
      .append < SVGGElement > ('g')
      .style("pointer-events", "all")
      .attr('class', 'hospital')
      .merge(this.gHospitals)
      .attr('transform', d => {
        const p = this.latLngPoint({lat: this.latAcc(d), lng: this.lngAcc(d) });
        d.properties.x = p.x;
        d.properties.y = p.y;
        d.properties._x = p.x;
        d.properties._y = p.y;

        const p2 = this.getTransformPixelPosition(p);

        return `translate(${p2.x}, ${p2.y})`;
      });

    this.gHospitals
      .exit()
      .remove();
  }

  appendGlyphContainer(): Selection < SVGGElement, Feature < G, T > , SVGSVGElement, unknown > {
    return this.gHospitals
      .append("g")
      .attr("class", "container")
      .on('mouseenter', (d,i,n) => this.onMouseEnter(d, i, n))
      .on('mouseleave', () => this.onMouseLeave())
      .on('click', (d) => this.onClick(d));
  }

  appendBackgroundRect(container: Selection < SVGGElement, Feature < G, T > , SVGSVGElement, unknown > ) {
    container
      .append('rect')
      .attr('class', 'background-rect')
      .attr('width', this.glyphSize.width)
      .attr('height', this.glyphSize.height / 2);
  }

  abstract appendText(container: Selection < SVGGElement, Feature < G, T > , SVGSVGElement, unknown > );

  appendGlyphRects(container: Selection < SVGGElement, Feature < G, T > , SVGSVGElement, unknown > ) {
    container
      .append('rect')
      .attr('class', `bed ${BedType.icuLow}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('data-bedtype', BedType.icuLow)
      .attr('x', this.rectPadding)
      .attr('y', this.rectYOffset)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuLow, this.currentOptions?.date));

    container
      .append('rect')
      .attr('class', `bed ${BedType.icuHigh}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('data-bedtype', BedType.icuHigh)
      .attr('x', `${this.rectSize + this.rectPadding * 2}px`)
      .attr('y', this.rectYOffset)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.icuHigh, this.currentOptions?.date));

    container
      .append('rect')
      .attr('class', `bed ${BedType.ecmo}`)
      .attr('width', `${this.rectSize}px`)
      .attr('height', `${this.rectSize}px`)
      .attr('data-bedtype', BedType.ecmo)
      .attr('x', `${2 * this.rectSize + this.rectPadding * 3}px`)
      .attr('y', this.rectYOffset)
      .style('fill', d1 => this.colormapService.getLatestBedStatusColor(d1.properties.developments, BedType.ecmo, this.currentOptions?.date));
  }

}
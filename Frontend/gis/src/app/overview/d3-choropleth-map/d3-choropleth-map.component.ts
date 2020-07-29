import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { geoMercator, geoPath, GeoPath, GeoPermissibleObjects, GeoProjection } from 'd3-geo';
import { select, Selection } from 'd3-selection';
import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { timer } from 'rxjs';
import { RKICaseDevelopmentProperties } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { QualitativeTimedStatus } from '../../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../../repositories/types/out/aggregated-hospital-out';
import { ResizedEvent } from '../../shared/resized-event';

export type D3ChoroplethMapPermissibleFeatureCollection =
  FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>> |
  FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>;

export type D3ChoroplethMapPermissibleFeature =
  Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>> |
  Feature<MultiPolygon, RKICaseDevelopmentProperties>;

export interface D3ChoroplethMapData {
  data: D3ChoroplethMapPermissibleFeatureCollection;

  fillFn: (d: D3ChoroplethMapPermissibleFeature) => string;

  width: number;

  height: number;
}

@Component({
  selector: 'app-d3-choropleth-map',
  template: `
    <div #div (appResized)="onResized($event)" debounceTime="100" windowResizeOnly="true" style="width: 100%; height: 100%;">
      <svg #svg></svg>
    </div>`,
  styleUrls: ['./d3-choropleth-map.component.less']
})
export class D3ChoroplethMapComponent implements OnInit {

  @ViewChild('div', {static: true})
  private divRef: ElementRef<HTMLDivElement>;

  @ViewChild('svg', {static: true})
  private svgRef: ElementRef<SVGSVGElement>;

  private projection: GeoProjection;

  private path: GeoPath<any, GeoPermissibleObjects>;

  private svg: Selection<SVGSVGElement, unknown, null, undefined>;


  private _data: D3ChoroplethMapData;

  @Input()
  set data(d: D3ChoroplethMapData) {
    this._data = d;


    timer(50)
      .subscribe(() => {
        if (!this._data) {
          return;
        }

        const el = this.divRef.nativeElement;

        this._data.width = el.offsetWidth;
        this._data.height = el.offsetHeight;

        this.draw();
      });
  }

  get data(): D3ChoroplethMapData {
    return this._data;
  }

  constructor() {}

  ngOnInit(): void {
    this.projection = geoMercator();
      // .scale(1500)
      // .center([51.1069818075, 10.385780508]);

    this.path = geoPath()
      .projection(this.projection);

    this.svg = select(this.svgRef.nativeElement);

    timer(50)
      .subscribe(() => {
        if (!this._data) {
          return;
        }

        const el = this.divRef.nativeElement;

        this._data.width = el.offsetWidth;
        this._data.height = el.offsetHeight;

        this.draw();
      });
  }

  onResized(evt: ResizedEvent) {
    if (!this._data) {
      return;
    }

    if (evt.newWidth === 0) {
      return;
    }

    this._data.width = evt.newWidth;
    this._data.height = evt.newHeight;

    this.draw();
  }



  private draw(): void {
    if (!this._data) {
      return;
    }

    this.projection.fitSize([this._data.width, this._data.height], this._data.data);

    this.svg
      .attr('width', `${this._data.width}px`)
      .attr('height', `${this._data.height}px`);

    const data = this._data.data.features;


    const sel = this.svg.selectAll<SVGPathElement, D3ChoroplethMapPermissibleFeature>('path')
      .data<D3ChoroplethMapPermissibleFeature>(data);

    sel
      .enter()
      .append('path')
      .merge(sel)
      .attr('d', this.path)
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('fill', this._data.fillFn)
      .attr('stroke-width', 0.5)
      .attr('stroke', 'lightgrey');

    sel.exit().remove();
  }

}

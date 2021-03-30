/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { Region } from '../repositories/types/in/region';
import { getMoment } from '../util/date-util';
import { TableOverviewDataAndOptions, TableOverviewService } from './table-overview.service';
import { MultiLineChartDataAndOptions, VegaMultiLineChartService } from './vega-multilinechart.service';
import { PixelChartDataAndOptions, VegaPixelchartService } from './vega-pixelchart.service';

export interface MarkdownItem {
  type: 'markdown';
  _editMode?: boolean;
  text: string;
}

export interface PixelChartItem {
  type: 'pixel';
  dataRequest: Region[];
  config: CovidChartOptions;
  _compiled?: PixelChartDataAndOptions;
}

export interface MultiLineChartItem {
  type: 'multiline';
  dataRequest: Region[];
  config: CovidChartOptions;
  _compiled?: MultiLineChartDataAndOptions;
}

export interface TableOverviewItem {
  type: 'table';
  dataRequest: Region[];
  config: CovidChartOptions;
  _compiled?: Observable<TableOverviewDataAndOptions>;
}

export type Item = PixelChartItem | MultiLineChartItem | MarkdownItem | TableOverviewItem;

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  private tExtent: [string, string] = [null, null];
  private pixelZExtent: [number, number] = [0, 0];

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
    private vegaMultiLineChartService: VegaMultiLineChartService,
    private caseRepo: CaseDevelopmentRepository,
    private tableOverviewService: TableOverviewService
  ) {}


  public updateChartFull(d: Item): Observable<Item> {
    if (d.type === 'pixel') {
      return this.vegaPixelchartService.compileToDataAndOptions(d.config, d.dataRequest, false)
        .pipe(
          map(d1 => {
            d._compiled = d1;

            if (this.tExtent[0] === null || getMoment(this.tExtent[0]).isAfter(getMoment(d._compiled.chartOptions.xDomain[0]))) {
              this.tExtent[0] = d._compiled.chartOptions.xDomain[0];
            }

            if (this.tExtent[1] === null || getMoment(this.tExtent[1]).isBefore(getMoment(d._compiled.chartOptions.xDomain[1]))) {
              this.tExtent[1] = d._compiled.chartOptions.xDomain[1];
            }

            if (this.pixelZExtent[0] > d._compiled.chartOptions.domain[0]) {
              this.pixelZExtent[0] = d._compiled.chartOptions.domain[0];
            }

            if (this.pixelZExtent[1] < d._compiled.chartOptions.domain[1]) {
              this.pixelZExtent[1] = d._compiled.chartOptions.domain[1];
            }

            return d;
          })
        );
    }

    if (d.type === 'multiline') {
      return this.vegaMultiLineChartService.compileToDataAndOptions(d.config, d.dataRequest)
      .pipe(
        map(d1 => {
          if (this.tExtent[0] === null || getMoment(this.tExtent[0]).isAfter(getMoment(d1.chartOptions.xDomain[0]))) {
            this.tExtent[0] = d1.chartOptions.xDomain[0];
          }

          if (this.tExtent[1] === null || getMoment(this.tExtent[1]).isBefore(getMoment(d1.chartOptions.xDomain[1]))) {
            this.tExtent[1] = d1.chartOptions.xDomain[1];
          }

          d._compiled = d1;

          return d;
        })
      );
    }

    if (d.type === 'table') {
      d._compiled = this.tableOverviewService.compileToDataAndOptions(d.config, d.dataRequest);

      return of(d);
    }

    return of(d);
  }

  updateChartsShallow(items: Item[], containerWidth: number) {
    for(const item of items) {
        if (item.type === 'pixel') {
          const o: PixelChartDataAndOptions = item._compiled as PixelChartDataAndOptions;
          o.chartOptions.domain = this.pixelZExtent;
          o.chartOptions.xDomain = this.tExtent;
          o.chartOptions.width = containerWidth;

          item._compiled = {...o};
        }

        if (item.type === 'multiline') {
          item._compiled.chartOptions.xDomain = this.tExtent;
          item._compiled.chartOptions.width = containerWidth;

          item._compiled = {...item._compiled};
        }
      }
  }

  updateChartAndThenRefreshAll(d: Item, allItems: Item[], containerWidth: number) {
    this.updateChartFull(d)
    .subscribe(_ => this.updateChartsShallow(allItems, containerWidth));
  }
}

/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { Region } from '../repositories/types/in/region';
import { getMoment } from '../util/date-util';
import { ConfigService } from './config.service';
import { TableOverviewDataAndOptions, TableOverviewService } from './table-overview.service';
import { MultiLineChartDataAndOptions, VegaMultiLineChartService } from './vega-multilinechart.service';
import { PixelChartDataAndOptions, VegaPixelchartService } from './vega-pixelchart.service';
import { IcuCategoriesDataAndOptions, VegaStackedAreaIcuCategoriesService } from './vega-stacked-area-icu-categories.service';

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

export interface StackedAreaIcuItem {
  type: 'stackedareaicu';
  dataRequest: Region[];
  config: CovidChartOptions;
  _compiled?: IcuCategoriesDataAndOptions;
}

export type Item = PixelChartItem | MultiLineChartItem | MarkdownItem | TableOverviewItem | StackedAreaIcuItem;

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  private tExtent: [string, string] = [null, null];
  private pixelZExtent: [number, number] = [0, 0];

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
    private vegaMultiLineChartService: VegaMultiLineChartService,
    private tableOverviewService: TableOverviewService,
    private vegaStackedAreaIcuService: VegaStackedAreaIcuCategoriesService,
    private configService: ConfigService
  ) {}

  public resetExtents(): void {
    this.tExtent = [null, null];
    this.pixelZExtent = [0, 0];
  }


  public updateChartFull(d: Item): Observable<Item> {
    if (d.type === 'markdown') {
      return of(d);
    }

    const parsedCfg = this.configService.parseConfig(d.config, d.type, false);

    if (d.type === 'pixel') {
      return this.vegaPixelchartService.compileToDataAndOptions(parsedCfg.config, d.dataRequest, false)
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
      return this.vegaMultiLineChartService.compileToDataAndOptions(parsedCfg.config, d.dataRequest)
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
      d._compiled = this.tableOverviewService.compileToDataAndOptions(parsedCfg.config, d.dataRequest);

      return of(d);
    }

    if (d.type === 'stackedareaicu') {
      return this.vegaStackedAreaIcuService.compileToDataAndOptions(parsedCfg.config, d.dataRequest)
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

    throw new Error(`Cannot handle type ${d}`);
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

        if (item.type === 'stackedareaicu') {
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

  downloadDataAsCsv(item: Item): void {
    if (item.type === 'multiline') {
      this.vegaMultiLineChartService.downloadCsv(item);
    } else if (item.type === 'pixel') {
      this.vegaPixelchartService.downloadCsv(item);
    } else if (item.type === 'stackedareaicu') {
      this.vegaStackedAreaIcuService.downloadCsv(item);
    } else {
      throw new Error(`no download implemented for ${item.type}`);
    }
  }
}

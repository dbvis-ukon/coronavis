/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { Region } from '../repositories/types/in/region';
import { getMoment, getStrDate } from '../util/date-util';
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
  private valueExtent: Map<string, [number, number]> = new Map();

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
    private vegaMultiLineChartService: VegaMultiLineChartService,
    private tableOverviewService: TableOverviewService,
    private vegaStackedAreaIcuService: VegaStackedAreaIcuCategoriesService,
    private configService: ConfigService
  ) {}

  public resetExtents(): void {
    this.tExtent = [null, null];
    this.valueExtent.clear();
  }


  public updateChartFull(d: Item): Observable<Item> {
    if (d.type === 'markdown') {
      return of(d);
    }

    const parsedCfg = this.configService.parseConfig(d.config, d.type, false);
    const extKey = this.getValueExtentKey(parsedCfg.config);

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

            const ext = this.valueExtent.get(extKey) || [0, 0];

            if (ext[0] > d._compiled.chartOptions.domain[0]) {
              ext[0] = d._compiled.chartOptions.domain[0];
            }

            if (ext[1] < d._compiled.chartOptions.domain[1]) {
              ext[1] = d._compiled.chartOptions.domain[1];
            }

            this.valueExtent.set(extKey, ext);

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

          const ext = this.valueExtent.get(extKey) || [0, 0];

          if (ext[0] > d1.chartOptions.yDomain[0]) {
            ext[0] = d1.chartOptions.yDomain[0];
          }

          if (ext[1] < d1.chartOptions.yDomain[1]) {
            ext[1] = d1.chartOptions.yDomain[1];
          }

          this.valueExtent.set(extKey, ext);

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

          const ext = this.valueExtent.get(extKey) || [0, 0];

          if (ext[0] > d1.chartOptions.yDomain[0]) {
            ext[0] = d1.chartOptions.yDomain[0];
          }

          if (ext[1] < d1.chartOptions.yDomain[1]) {
            ext[1] = d1.chartOptions.yDomain[1];
          }

          this.valueExtent.set(extKey, ext);

          d._compiled = d1;

          return d;
        })
      );
    }

    throw new Error(`Cannot handle type ${d}`);
  }

  updateChartsShallow(items: Item[], containerWidth: number) {
    for(const item of items) {
      const cfg = (item as PixelChartItem)?._compiled?.config;
      let newTExtent: [string, string] = null;
      if (cfg && cfg.temporalExtent.type === 'global') {
        newTExtent = this.tExtent;
      } else if (cfg && cfg.temporalExtent.type === 'manual') {
        if (cfg.temporalExtent.manualLastDays > 0) {
          newTExtent = [getMoment(this.tExtent[1]).subtract(cfg.temporalExtent.manualLastDays, 'days').toISOString(), this.tExtent[1]];
        } else {
          newTExtent = cfg.temporalExtent.manualExtent;
        }
      }

      const extKey = this.getValueExtentKey(cfg);
      let newVExtent: [number, number] = null;

      if (cfg && cfg.valueExtent.type === 'global') {
        newVExtent = this.valueExtent.get(extKey);
      } else if (cfg && cfg.valueExtent.type === 'manual') {
        newVExtent = cfg.valueExtent.manualExtent;
      }

      if (item.type === 'pixel') {
        if (newTExtent) {
          item._compiled.chartOptions.xDomain[0] = getStrDate(getMoment(newTExtent[0]).startOf('week'));
          item._compiled.chartOptions.xDomain[1] = getStrDate(getMoment(newTExtent[1]).endOf('week'));
        }

        if (newVExtent) {
          item._compiled.chartOptions.domain = newVExtent;
        }

        item._compiled.chartOptions.width = containerWidth;

        item._compiled = {...item._compiled};
      }

      if (item.type === 'multiline') {

        if (newTExtent) {
          item._compiled.chartOptions.xDomain = newTExtent;
        }

        if (newVExtent) {
          item._compiled.chartOptions.yDomain = newVExtent;
        }

        item._compiled.chartOptions.width = containerWidth;

        item._compiled = {...item._compiled};
      }

      if (item.type === 'stackedareaicu') {
        if (newTExtent) {
          item._compiled.chartOptions.xDomain = newTExtent;
        }

        if (newVExtent) {
          item._compiled.chartOptions.yDomain = newVExtent;
        }


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

  private getValueExtentKey(cfg: CovidChartOptions): string | null {
    if (!cfg) {
      return null;
    }
    return cfg.type + ':' + cfg.normalization;
  }
}

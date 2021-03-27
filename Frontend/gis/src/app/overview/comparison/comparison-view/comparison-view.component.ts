import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { from, of } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { AgeGroupBinning, CovidChartOptions, ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { MultiLineChartDataAndOptions, VegaMultiLineChartService } from 'src/app/services/vega-multilinechart.service';
import { PixelChartDataAndOptions, VegaPixelchartService } from 'src/app/services/vega-pixelchart.service';
import { getMoment } from 'src/app/util/date-util';
import { SettingsComponent } from '../settings/settings.component';

export interface DataRequest {
  aggLevel: AggregationLevel;
  id: string;
}

export interface SeparatorItem {
  type: 'separator';
  title: string;
  titleEditMode: boolean;
  dataRequest?: undefined;
  config?: undefined;
}

export interface ChartItem {
  type: 'pixel';
  titleEditMode: false;
  title: string;
  dataRequest: DataRequest[];
  config: CovidChartOptions;
  _compiled?: PixelChartDataAndOptions;
}

export interface MultiLineChartItem {
  type: 'multiline';
  dataRequest: DataRequest[];
  config: CovidChartOptions;
  _compiled?: MultiLineChartDataAndOptions;
}

export type Item = ChartItem | SeparatorItem | MultiLineChartItem;

@Component({
  selector: 'app-comparison-view',
  templateUrl: './comparison-view.component.html',
  styleUrls: ['./comparison-view.component.less']
})
export class ComparisonViewComponent implements OnInit {

  @ViewChild('pleaseWait', {static: false})
  pleaseWaitDiv: ElementRef<HTMLDivElement>;

  pleaseWait = false;

  timelineData: Item[] = [
    {
      type: 'multiline',
      dataRequest: [
        {
          id: '01',
          aggLevel: AggregationLevel.state
        },
        {
          id: '02',
          aggLevel: AggregationLevel.state
        },
        {
          id: '03',
          aggLevel: AggregationLevel.state
        },
        {
          id: '04',
          aggLevel: AggregationLevel.state
        },
        {
          id: '05',
          aggLevel: AggregationLevel.state
        },
        {
          id: '06',
          aggLevel: AggregationLevel.state
        },
        {
          id: '07',
          aggLevel: AggregationLevel.state
        },
        {
          id: '08',
          aggLevel: AggregationLevel.state
        },
        {
          id: '09',
          aggLevel: AggregationLevel.state
        },
        {
          id: '10',
          aggLevel: AggregationLevel.state
        },
        {
          id: '11',
          aggLevel: AggregationLevel.state
        },
        {
          id: '12',
          aggLevel: AggregationLevel.state
        },
        {
          id: '13',
          aggLevel: AggregationLevel.state
        },
        {
          id: '14',
          aggLevel: AggregationLevel.state
        },
        {
          id: '15',
          aggLevel: AggregationLevel.state
        },
        {
          id: '16',
          aggLevel: AggregationLevel.state
        },
        {
          id: 'de',
          aggLevel: AggregationLevel.country
        }
      ],
      config: {
        change: CovidNumberCaseChange.absolute,
        dataSource: 'rki',
        date: 'now',
        daysForTrend: 7,
        normalization: CovidNumberCaseNormalization.per100k,
        scaleType: ScaleType.linear,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        showLabels: true,
        showOnlyAvailableCounties: true,
        showTrendGlyphs: true,
        timeAgg: TimeGranularity.yearmonthdate,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases
      }
    },
    {
      type: 'multiline',
      dataRequest: [
        {
          id: '08335',
          aggLevel: AggregationLevel.county
        },
        {
          id: '08',
          aggLevel: AggregationLevel.state
        },
        {
          id: 'de',
          aggLevel: AggregationLevel.country
        }
      ],
      config: {
        change: CovidNumberCaseChange.absolute,
        dataSource: 'risklayer',
        date: 'now',
        daysForTrend: 7,
        normalization: CovidNumberCaseNormalization.per100k,
        scaleType: ScaleType.linear,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        showLabels: true,
        showOnlyAvailableCounties: true,
        showTrendGlyphs: true,
        timeAgg: TimeGranularity.yearmonthdate,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases
      }
    },
    {
      type: 'multiline',
      dataRequest: [
        {
          id: '08335',
          aggLevel: AggregationLevel.county
        },
        {
          id: '08',
          aggLevel: AggregationLevel.state
        },
        {
          id: 'de',
          aggLevel: AggregationLevel.country
        }
      ],
      config: {
        change: CovidNumberCaseChange.absolute,
        dataSource: 'rki',
        date: 'now',
        daysForTrend: 7,
        normalization: CovidNumberCaseNormalization.per100k,
        scaleType: ScaleType.linear,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        showLabels: true,
        showOnlyAvailableCounties: true,
        showTrendGlyphs: true,
        timeAgg: TimeGranularity.yearmonthdate,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases
      }
    },
    {
      type: 'pixel',
      titleEditMode: false,
      title: 'Test123',
      dataRequest: [
        {
          id: '08335',
          aggLevel: AggregationLevel.county
        },
        {
          id: '08336',
          aggLevel: AggregationLevel.county
        }
      ],
      config: {
        change: CovidNumberCaseChange.absolute,
        dataSource: 'rki',
        date: 'now',
        daysForTrend: 7,
        normalization: CovidNumberCaseNormalization.per100k,
        scaleType: ScaleType.linear,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        showLabels: true,
        showOnlyAvailableCounties: true,
        showTrendGlyphs: true,
        timeAgg: TimeGranularity.yearmonthdate,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases
      }
    },
    {
      type: 'pixel',
      titleEditMode: false,
      title: 'Test123',
      dataRequest: [
        {
          id: '08',
          aggLevel: AggregationLevel.state
        }
      ],
      config: {
        change: CovidNumberCaseChange.absolute,
        dataSource: 'rki',
        date: 'now',
        daysForTrend: 7,
        normalization: CovidNumberCaseNormalization.per100k,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        scaleType: ScaleType.linear,
        showLabels: true,
        showOnlyAvailableCounties: true,
        showTrendGlyphs: true,
        timeAgg: TimeGranularity.yearmonthdate,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases
      }
    },
    {
      type: 'pixel',
      titleEditMode: false,
      title: 'Test123',
      dataRequest: [
        {
          id: 'de',
          aggLevel: AggregationLevel.country
        }
      ],
      config: {
        change: CovidNumberCaseChange.absolute,
        dataSource: 'rki',
        date: 'now',
        daysForTrend: 7,
        normalization: CovidNumberCaseNormalization.per100k,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        scaleType: ScaleType.linear,
        showLabels: true,
        showOnlyAvailableCounties: true,
        showTrendGlyphs: true,
        timeAgg: TimeGranularity.yearmonthdate,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases
      }
    }
  ];

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private vegaPixelchartService: VegaPixelchartService,
    private vegaMultiLineChartService: VegaMultiLineChartService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {

    const tExtent: [string, string] = [null, null];
    const pixelZExtent: [number, number] = [0, 0];
    this.pleaseWait = true;

    from(this.timelineData)
    .pipe(
      mergeMap(d => {
        if (d.type === 'pixel') {
          return this.caseRepo.getCasesDevelopmentAggregated('rki', d.dataRequest)
            .pipe(
              map(d1 => d1.properties),
              map(d1 => {
                d._compiled = this.vegaPixelchartService.compileToDataAndOptions(d.config, d1, false);

                if (tExtent[0] === null || getMoment(tExtent[0]).isAfter(getMoment(d._compiled.chartOptions.xDomain[0]))) {
                  tExtent[0] = d._compiled.chartOptions.xDomain[0];
                }

                if (tExtent[1] === null || getMoment(tExtent[1]).isBefore(getMoment(d._compiled.chartOptions.xDomain[1]))) {
                  tExtent[1] = d._compiled.chartOptions.xDomain[1];
                }

                if (pixelZExtent[0] > d._compiled.chartOptions.domain[0]) {
                  pixelZExtent[0] = d._compiled.chartOptions.domain[0];
                }

                if (pixelZExtent[1] < d._compiled.chartOptions.domain[1]) {
                  pixelZExtent[1] = d._compiled.chartOptions.domain[1];
                }

                return d;
              })
            );
        }

        if (d.type === 'multiline') {
          return this.vegaMultiLineChartService.compileToDataAndOptions(d.config, d.dataRequest)
          .pipe(
            map(d1 => {
              if (tExtent[0] === null || getMoment(tExtent[0]).isAfter(getMoment(d1.chartOptions.xDomain[0]))) {
                tExtent[0] = d1.chartOptions.xDomain[0];
              }

              if (tExtent[1] === null || getMoment(tExtent[1]).isBefore(getMoment(d1.chartOptions.xDomain[1]))) {
                tExtent[1] = d1.chartOptions.xDomain[1];
              }

              d._compiled = d1;

              return d;
            })
          );
        }

        return of(d);
      }),
      toArray()
    )
    .subscribe(items => {
      const width = this.pleaseWaitDiv.nativeElement.offsetWidth - 60;


      for(const item of items) {
          if (item.type === 'pixel') {
            const o: PixelChartDataAndOptions = item._compiled as PixelChartDataAndOptions;
            o.chartOptions.domain = pixelZExtent;
            o.chartOptions.xDomain = tExtent;
            o.chartOptions.width = width;

            item._compiled = {...o};
          }

          if (item.type === 'multiline') {
            item._compiled.chartOptions.xDomain = tExtent;
            item._compiled.chartOptions.width = width + 10;

            item._compiled = {...item._compiled};
          }
      }

      this.pleaseWait = false;
    });

  }

  drop(event: CdkDragDrop<ChartItem[]>) {
    moveItemInArray(this.timelineData, event.previousIndex, event.currentIndex);
    // this.saveTimelineData();
  }

  openSettings(chart?: ChartItem) {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '90vw',
      data: {chartItem: chart}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    });
  }

  remove(chart: ChartItem) {
    const idx = this.timelineData.indexOf(chart);
    if (idx > -1) {
      this.timelineData.splice(idx, 1);
    }
  }

  add(chart) {}
}

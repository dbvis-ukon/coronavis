import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { AgeGroupBinning, CovidChartOptions, ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { Region } from 'src/app/repositories/types/in/region';
import { MultiLineChartDataAndOptions, VegaMultiLineChartService } from 'src/app/services/vega-multilinechart.service';
import { PixelChartDataAndOptions, VegaPixelchartService } from 'src/app/services/vega-pixelchart.service';
import { getMoment } from 'src/app/util/date-util';
import { SettingsComponent } from '../settings/settings.component';

export interface SeparatorItem {
  type: 'separator';
  title: string;
  titleEditMode: boolean;
  dataRequest?: undefined;
  config?: undefined;
}

export interface MarkdownItem {
  type: 'markdown';
  _editMode?: boolean;
  text: string;
}

export interface ChartItem {
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

export type Item = ChartItem | SeparatorItem | MultiLineChartItem | MarkdownItem;

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
      type: 'markdown',
      text: `# CoronaVis Dashboards

In dieser Version können Benutzer selbständig Dashboards generieren, anpassen und über URLs teilen.
Zusätzlich zu den Charts können Textblöcke mit Markdown eingefügt werden um Erklärungen zu schreiben.

## Funktioniert bereits:
- Markdown bearbeiten
- Charts editieren (work-in-progress)
- Charts löschen
- Charts neu anordnen
- Multi-Series-Linechart mit Inzidenzen
- Inzidenzen nach Altersgruppen

## Todo:
- Dashboards persistent speichern
- Charts editieren
- Neue Charts und Text Elemente hinzufügen
- Multi-Series-Linechart erweitern für Bettenkapazitäten, Covid-19 Patienten, Todesfälle
- Tabellen-Chart
      `
    },
    // {
    //   type: 'multiline',
    //   dataRequest: [
    //     {
    //       id: '01',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '02',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '03',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '04',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '05',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '06',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '07',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '08',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '09',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '10',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '11',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '12',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '13',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '14',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '15',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: '16',
    //       aggLevel: AggregationLevel.state
    //     },
    //     {
    //       id: 'de',
    //       aggLevel: AggregationLevel.country
    //     }
    //   ],
    //   config: {
    //     change: CovidNumberCaseChange.absolute,
    //     dataSource: 'rki',
    //     date: 'now',
    //     daysForTrend: 7,
    //     normalization: CovidNumberCaseNormalization.per100k,
    //     scaleType: ScaleType.linear,
    //     ageGroupBinning: AgeGroupBinning.fiveyears,
    //     showLabels: true,
    //     showOnlyAvailableCounties: true,
    //     showTrendGlyphs: true,
    //     timeAgg: TimeGranularity.yearmonthdate,
    //     timeWindow: CovidNumberCaseTimeWindow.sevenDays,
    //     type: CovidNumberCaseType.cases
    //   }
    // },
    {
      type: 'multiline',
      dataRequest: [
        {
          id: '08335',
          aggLevel: AggregationLevel.county,
          name: 'Konstanz',
          description: 'Landkreis'
        },
        {
          id: '08',
          aggLevel: AggregationLevel.state,
          name: 'Baden-Württemberg',
          description: 'BL'
        },
        {
          id: 'de',
          aggLevel: AggregationLevel.country,
          name: 'Germany',
          description: 'L'
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
      type: 'pixel',
      dataRequest: [
        {
          id: '08335',
          aggLevel: AggregationLevel.county,
          name: 'Konstanz',
          description: 'Landkreis'
        },
        {
          id: '08336',
          aggLevel: AggregationLevel.county,
          name: 'Lörrach',
          description: 'Landkreis'
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
      dataRequest: [
        {
          id: '08',
          aggLevel: AggregationLevel.state,
          name: 'Baden-Württemberg',
          description: 'BL'
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
    // {
    //   type: 'pixel',
    //   dataRequest: [
    //     {
    //       id: 'de',
    //       aggLevel: AggregationLevel.country,
    //       name: 'Germany',
    //       description: 'L'
    //     }
    //   ],
    //   config: {
    //     change: CovidNumberCaseChange.absolute,
    //     dataSource: 'rki',
    //     date: 'now',
    //     daysForTrend: 7,
    //     normalization: CovidNumberCaseNormalization.per100k,
    //     ageGroupBinning: AgeGroupBinning.fiveyears,
    //     scaleType: ScaleType.linear,
    //     showLabels: true,
    //     showOnlyAvailableCounties: true,
    //     showTrendGlyphs: true,
    //     timeAgg: TimeGranularity.yearmonthdate,
    //     timeWindow: CovidNumberCaseTimeWindow.sevenDays,
    //     type: CovidNumberCaseType.cases
    //   }
    // }
  ];


  private tExtent: [string, string] = [null, null];
  private pixelZExtent: [number, number] = [0, 0];

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private vegaPixelchartService: VegaPixelchartService,
    private vegaMultiLineChartService: VegaMultiLineChartService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {

    this.pleaseWait = true;

    from(this.timelineData)
    .pipe(
      mergeMap(d => this.updateChartFull(d)),
      toArray()
    )
    .subscribe(items => this.updateChartsShallow(items));

  }

  drop(event: CdkDragDrop<ChartItem[]>) {
    moveItemInArray(this.timelineData, event.previousIndex, event.currentIndex);
    // this.saveTimelineData();
  }

  openSettings(chart?: ChartItem, arrIdx?: number) {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '90vw',
      data: {chartItem: JSON.parse(JSON.stringify(chart)), arrIdx}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result) {
        this.timelineData[result.arrIdx] = result.chartItem;
        this.updateChartAndThenRefreshAll(result.chartItem);
      }
    });
  }

  remove(chart: ChartItem) {
    const idx = this.timelineData.indexOf(chart);
    if (idx > -1) {
      this.timelineData.splice(idx, 1);
    }
  }

  add(chart) {}

  updateChartFull(d: Item): Observable<Item> {
    if (d.type === 'pixel') {
      return this.caseRepo.getCasesDevelopmentAggregated('rki', d.dataRequest)
        .pipe(
          map(d1 => d1.properties),
          map(d1 => {
            d._compiled = this.vegaPixelchartService.compileToDataAndOptions(d.config, d1, false);

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

    return of(d);
  }

  updateChartsShallow(items: Item[]) {
    this.pleaseWait = true;

    setTimeout(() => {
      const width = this.pleaseWaitDiv.nativeElement.offsetWidth - 60;
      for(const item of items) {
          if (item.type === 'pixel') {
            const o: PixelChartDataAndOptions = item._compiled as PixelChartDataAndOptions;
            o.chartOptions.domain = this.pixelZExtent;
            o.chartOptions.xDomain = this.tExtent;
            o.chartOptions.width = width;

            item._compiled = {...o};
          }

          if (item.type === 'multiline') {
            item._compiled.chartOptions.xDomain = this.tExtent;
            item._compiled.chartOptions.width = width + 10;

            item._compiled = {...item._compiled};
          }
      }
      this.pleaseWait = false;
    }, 100);
  }

  updateChartAndThenRefreshAll(d: Item) {
    this.updateChartFull(d)
    .subscribe(_ => this.updateChartsShallow(this.timelineData));
  }
}

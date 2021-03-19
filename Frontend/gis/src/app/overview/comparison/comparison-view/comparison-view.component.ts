import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { AgeGroupBinning, CovidChartOptions, ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';

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
}

export type Item = ChartItem | SeparatorItem;

@Component({
  selector: 'app-comparison-view',
  templateUrl: './comparison-view.component.html',
  styleUrls: ['./comparison-view.component.less']
})
export class ComparisonViewComponent implements OnInit {

  timelineData: Item[] = [
    {
      type: 'separator',
      titleEditMode: false,
      title: 'Test'
    },
    {
      type: 'pixel',
      titleEditMode: false,
      title: 'Test123',
      dataRequest: [
        {
          id: '08335',
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
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  drop(event: CdkDragDrop<ChartItem[]>) {
    moveItemInArray(this.timelineData, event.previousIndex, event.currentIndex);
    // this.saveTimelineData();
  }

  openSettings(chart?) {
  }

  remove(chart: ChartItem) {
    const idx = this.timelineData.indexOf(chart);
    if (idx > -1) {
      this.timelineData.splice(idx, 1);
    }
  }

  add(chart) {}
}

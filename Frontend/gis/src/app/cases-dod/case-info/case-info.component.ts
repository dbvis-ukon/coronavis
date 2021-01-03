import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { merge } from 'lodash-es';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties } from '../../repositories/types/in/quantitative-rki-case-development';
import { CovidChartOptions, ScaleType, TimeGranularity } from '../covid-chart-options';

@Component({
  selector: 'app-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.less'],
  providers: [DecimalPipe]
})
export class CaseInfoComponent {

  @Input()
  public data: RKICaseDevelopmentProperties;

  @Input()
  set options(o: CovidNumberCaseOptions) {
    this._options = o;

    if (o) {
      this.chartOptions = {...merge<CovidNumberCaseOptions, Partial<CovidChartOptions>>(o, {
        timeAgg: TimeGranularity.yearmonthdate,
        scaleType: ScaleType.linear
      })} as CovidChartOptions;
    }
  }

  get options(): CovidNumberCaseOptions {
    return this._options;
  }

  private _options: CovidNumberCaseOptions;

  chartOptions: CovidChartOptions;

  @Input()
  public tooltip: boolean;


  eChange = CovidNumberCaseChange;

  eTime = CovidNumberCaseTimeWindow;

  eType = CovidNumberCaseType;

  eNorm = CovidNumberCaseNormalization;

  eGran = TimeGranularity;

  eScaleType = ScaleType;

  constructor(
  ) {}


  updateChartOptions() {
    this.chartOptions = {...this.chartOptions};
  }

}

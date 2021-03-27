import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { MultiLineChartDataAndOptions, VegaMultiLineChartService } from 'src/app/services/vega-multilinechart.service';

@Component({
  selector: 'app-multi-line-chart',
  templateUrl: './multi-line-chart.component.html',
  styleUrls: ['./multi-line-chart.component.less']
})
export class MultiLineChartComponent implements OnInit {

  @ViewChild('i18nAltersgruppe', {static: true})
  i18nAltersgruppe: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nDatum', {static: true})
  i18nDatum: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nWoche', {static: true})
  i18nWoche: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nVal', {static: true})
  i18nVal: ElementRef<HTMLSpanElement>;

  _dataAndOptions: MultiLineChartDataAndOptions;

  @Input()
  public set dataAndOptions(d: MultiLineChartDataAndOptions) {
    this._dataAndOptions = d;

    this.updateChart();
  }

  public get dataAndOptions(): MultiLineChartDataAndOptions {
    return this._dataAndOptions;
  }

  spec: any;

  titleRegions: string;

  eCovidNumberCaseType = CovidNumberCaseType;
  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;
  eCovidChartTimeGranularity = TimeGranularity;
  eCovidChartScaleType = ScaleType;

  constructor(
    private multiLineChartService: VegaMultiLineChartService
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    if (!this._dataAndOptions) {
      return;
    }

    this.spec = this.multiLineChartService.compileChart(this._dataAndOptions);
  }
}

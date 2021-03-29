import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PixelChartDataAndOptions, VegaPixelchartService } from 'src/app/services/vega-pixelchart.service';

@Component({
  selector: 'app-pixel-chart',
  templateUrl: './pixel-chart.component.html',
  styleUrls: ['./pixel-chart.component.less']
})
export class PixelChartComponent implements OnInit {

  @ViewChild('i18nAltersgruppe', {static: true})
  i18nAltersgruppe: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nDatum', {static: true})
  i18nDatum: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nWoche', {static: true})
  i18nWoche: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nVal', {static: true})
  i18nVal: ElementRef<HTMLSpanElement>;

  _dataAndOptions: PixelChartDataAndOptions;

  @Input()
  public set dataAndOptions(d: PixelChartDataAndOptions) {
    this._dataAndOptions = d;

    this.updateChart();
  }

  public get dataAndOptions(): PixelChartDataAndOptions {
    return this._dataAndOptions;
  }

  spec: any;

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    if (!this._dataAndOptions) {
      return;
    }

    this.spec = this.vegaPixelchartService.compileChart(this._dataAndOptions.data, this._dataAndOptions.chartOptions);
  }
}

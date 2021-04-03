import { Component, Input, OnInit } from '@angular/core';
import { IcuCategoriesDataAndOptions, VegaStackedAreaIcuCategoriesService } from 'src/app/services/vega-stacked-area-icu-categories.service';

@Component({
  selector: 'app-stacked-area-icu-chart',
  templateUrl: './stacked-area-icu-chart.component.html',
  styleUrls: ['./stacked-area-icu-chart.component.less']
})
export class StackedAreaIcuChartComponent implements OnInit {

  _dataAndOptions: IcuCategoriesDataAndOptions;

  @Input()
  public set dataAndOptions(d: IcuCategoriesDataAndOptions) {
    this._dataAndOptions = d;

    this.updateChart();
  }

  public get dataAndOptions(): IcuCategoriesDataAndOptions {
    return this._dataAndOptions;
  }

  spec: any;

  constructor(
    private vegaService: VegaStackedAreaIcuCategoriesService,
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    if (!this._dataAndOptions) {
      return;
    }

    this.spec = this.vegaService.compileChart(this._dataAndOptions);
  }
}

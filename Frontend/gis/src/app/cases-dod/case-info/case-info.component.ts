import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { merge } from 'lodash-es';
import { Region } from 'src/app/repositories/types/in/region';
import { ConfigService } from 'src/app/services/config.service';
import { TableOverviewDataAndOptions, TableOverviewService } from 'src/app/services/table-overview.service';
import { PixelChartDataAndOptions, VegaPixelchartService } from 'src/app/services/vega-pixelchart.service';
import { CovidNumberCaseChange, CovidNumberCaseDataSource, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties } from '../../repositories/types/in/quantitative-rki-case-development';
import { AgeGroupBinning, CovidChartOptions, ScaleType, TimeGranularity } from '../covid-chart-options';

@Component({
  selector: 'app-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.less'],
  providers: [DecimalPipe]
})
export class CaseInfoComponent implements OnInit {

  @Input()
  public data: RKICaseDevelopmentProperties;

  @Input()
  set options(o: CovidNumberCaseOptions) {
    this._options = o;

    if (o) {
      this.chartOptions = {...merge<CovidNumberCaseOptions, Partial<CovidChartOptions>>(o, {
        timeAgg: TimeGranularity.yearmonthdate,
        scaleType: ScaleType.linear,
        ageGroupBinning: AgeGroupBinning.fiveyears
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

  eAgeGroupBinning = AgeGroupBinning;

  eGran = TimeGranularity;

  eScaleType = ScaleType;

  pixelChartDataAndOptions: PixelChartDataAndOptions;
  tableData: TableOverviewDataAndOptions;

  constructor(
    private router: Router,
    private dialogService: MatDialog,
    private vegaPixelchartService: VegaPixelchartService,
    private tableOverviewService: TableOverviewService,
    private configService: ConfigService
  ) {}


  ngOnInit(): void {
    this.updateChartOptions();
  }

  updateChartOptions(auto=false) {
    this.chartOptions = {...this.chartOptions};

    const region: Region = {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description,
      aggLevel: this.chartOptions.aggregationLevel
    };

    this.tableOverviewService.compileToDataAndOptions(this.configService.parseConfig(this.chartOptions, 'table', auto).config, [region])
    .subscribe(d => this.tableData = d);

    this.vegaPixelchartService.compileToDataAndOptions(this.configService.parseConfig(this.chartOptions, 'pixel', false).config, [region], auto)
    .subscribe(d => this.pixelChartDataAndOptions = d);
  }

  openAsDashboard() {
    this.dialogService.closeAll();
    const params = ['/', 'overview', 'dashboard', this.data.id];
    if (this._options.dataSource === CovidNumberCaseDataSource.risklayer) {
      params.push(CovidNumberCaseDataSource.risklayer);
    }
    this.router.navigate(params);
  }

}

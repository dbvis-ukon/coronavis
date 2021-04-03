import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { timer } from 'rxjs';
import { AgeGroupBinning, ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { CovidNumberCaseChange, CovidNumberCaseDataSource, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { ChartService, MultiLineChartItem, PixelChartItem, StackedAreaIcuItem, TableOverviewItem } from 'src/app/services/chart.service';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.less']
})
export class SettingsComponent implements OnInit {

  @ViewChild('dialogContent', {static: true})
  dialogContentDiv: ElementRef<HTMLDivElement>;

  pleaseWait = false;

  eChange = CovidNumberCaseChange;

  eTime = CovidNumberCaseTimeWindow;

  eType = CovidNumberCaseType;

  eNorm = CovidNumberCaseNormalization;

  eAgeGroupBinning = AgeGroupBinning;

  eGran = TimeGranularity;

  eScaleType = ScaleType;

  eDataSource = CovidNumberCaseDataSource;

  disabled: Set<string> = new Set();
  hidden: Set<string> = new Set();

  hasAutoConfig = false;

  constructor(
    public dialogRef: MatDialogRef<SettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {chartItem: MultiLineChartItem | PixelChartItem | TableOverviewItem | StackedAreaIcuItem; arrIdx: number},
    private chartService: ChartService,
    private configService: ConfigService) {}

  ngOnInit(): void {
    this.compileChart();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  compileChart(autoConfig = false) {
    if (this.data.chartItem.dataRequest.length === 0) {
      return;
    }

    this.pleaseWait = true;

    this.hasAutoConfig = this.configService.getAutoConfig(this.data.chartItem.config, this.data.chartItem.type) !== null;

    const ret = this.configService.parseConfig(this.data.chartItem.config, this.data.chartItem.type, autoConfig);

    console.log('parsedCfg', ret);

    this.data.chartItem.config = ret.config;

    this.disabled = ret.disabled;
    this.hidden = ret.hidden;

    timer(100)
    .subscribe(() => {
      const width = this.dialogContentDiv.nativeElement.offsetWidth - 100;

      this.chartService.updateChartFull(this.data.chartItem)
      .subscribe(i =>  {
        this.chartService.updateChartsShallow([i], width);

        this.pleaseWait = false;
      });
    });
  }

  hasErrorState(): boolean {
    return this.data.chartItem.dataRequest.length === 0 || this.data.chartItem.dataRequest.length > 20;
  }

  loadAutoConfig(): void {
    const auto = this.configService.getAutoConfig(this.data.chartItem.config, this.data.chartItem.type);
    if (auto !== null) {
      this.data.chartItem.config = auto;
      this.compileChart();
    }
  }
}

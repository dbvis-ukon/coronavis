import { Component, Input, OnInit } from '@angular/core';
import { exception } from 'console';
import { map } from 'rxjs/operators';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { RKIAgeGroups, RKICaseDevelopmentProperties, RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { VegaPixelchartService } from '../../services/vega-pixelchart.service';

@Component({
  selector: 'app-case-agegroup-chart',
  templateUrl: './case-agegroup-chart.component.html',
  styleUrls: ['./case-agegroup-chart.component.less']
})
export class CaseAgegroupChartComponent implements OnInit {

  _data: RKICaseDevelopmentProperties;

  _options: CovidNumberCaseOptions;

  @Input()
  public set data(d: RKICaseDevelopmentProperties) {
    this._data = d;

    this.updateChart();
  }

  public get data(): RKICaseDevelopmentProperties {
    return this._data;
  }

  @Input()
  public set options(o: CovidNumberCaseOptions) {
    this._options = JSON.parse(JSON.stringify(o));

    this.updateChart();
  }

  public get options(): CovidNumberCaseOptions {
    return this._options;
  }

  spec: any;

  scaleTypes = ['linear', 'sqrt', 'symlog'];
  scaleType = 'linear';

  eCovidNumberCaseType = CovidNumberCaseType;
  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
    private caseRepo: CaseDevelopmentRepository
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(): void {
    console.log(this._data, this._options);
    if (!this._data?.id || !this._options) {
      return;
    }

    this.caseRepo.getCasesDevelopmentForAggLevelSingle(
      'rki',
      this._options.aggregationLevel,
      this._data.id
    )
    .pipe(
      map(d => d.properties)
    )
    .subscribe(fullData => this.compileChart(fullData));
  }

  private compileChart(fullData: RKICaseDevelopmentProperties) {
    let idxDiff = 1;
    switch (this._options.timeWindow) {
      case CovidNumberCaseTimeWindow.twentyFourhours:
        idxDiff = 1;
        break;

      case CovidNumberCaseTimeWindow.seventyTwoHours:
        idxDiff = 3;
        break;

      case CovidNumberCaseTimeWindow.sevenDays:
        idxDiff = 7;
        break;

      default:
        idxDiff = 7;
    }

    let ageGroupAccessor: ((s: RKICaseTimedStatus) => RKIAgeGroups);

    switch (this._options.type) {
      case CovidNumberCaseType.cases:
        ageGroupAccessor = ((s: RKICaseTimedStatus) => s.cases_by_agegroup);
        break;

      case CovidNumberCaseType.deaths:
        ageGroupAccessor = ((s: RKICaseTimedStatus) => s.deaths_by_agegroup);
        break;
    }

    const data = [];

    for (let i = idxDiff; i < fullData.developments.length; i++) {
      const agNow: RKIAgeGroups = ageGroupAccessor(fullData.developments[i]);
      const agOld: RKIAgeGroups = ageGroupAccessor(fullData.developments[i - idxDiff]);

      for (const k of Object.keys(agNow)) {
        if (this._options.normalization === CovidNumberCaseNormalization.per100k && k === 'Aunknown') {
          continue;
        }
        let diff = (agNow[k] - agOld[k]);

        if (this._options.normalization === CovidNumberCaseNormalization.per100k) {
          diff = diff / fullData.developments[i].population_by_agegroup[k] * 100000;
        }

        data.push({
          x: fullData.developments[i].timestamp,
          y: k,
          val: diff
        });
      }
    }

    console.log(data);

    this.spec = this.vegaPixelchartService.compileChart(data, {
      xAxisTitle: 'Datum',
      yAxisTitle: 'Altersgruppe',
      width: 600,
      scaleType: this.scaleType}
    );

    console.log('chart', JSON.stringify(this.spec));
  }

}

import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { AggregationLevel } from '../map/options/aggregation-level';
import { CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseChange, CovidNumberCaseType } from '../map/options/covid-number-case-options';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  constructor() { }

  infoboxExtended = true;

  @Input()
  aggregationLevel: AggregationLevel;

  @Output()
  aggregationLevelChange: EventEmitter<AggregationLevel> = new EventEmitter();

  @Input()
  showOsmHospitals: boolean;

  @Output()
  showOsmHospitalsChange: EventEmitter<boolean> = new EventEmitter();

  @Input()
  showOsmHeliports: boolean;

  @Output()
  showOsmHeliportsChange: EventEmitter<boolean> = new EventEmitter();

  @Input()
  caseChoroplethOptions: CovidNumberCaseOptions;

  @Output()
  caseChoroplethOptionsChange: EventEmitter<CovidNumberCaseOptions> = new EventEmitter();

  covidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  covidNumberCaseChange = CovidNumberCaseChange;

  covidNumberCaseType = CovidNumberCaseType;

  ngOnInit(): void {
  }

  emitCaseChoroplethOptions() {
    // console.log('emit', this.caseChoroplethOptions);

    if(this.caseChoroplethOptions.change === CovidNumberCaseChange.relative
      && this.caseChoroplethOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
        this.caseChoroplethOptions.timeWindow = CovidNumberCaseTimeWindow.twentyFourhours;
      }
    this.caseChoroplethOptionsChange.emit({...this.caseChoroplethOptions});
  }

}

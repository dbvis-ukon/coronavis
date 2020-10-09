import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from '../services/case-util.service';

@Component({
  selector: 'app-case-tooltip',
  templateUrl: './case-tooltip.component.html',
  styleUrls: ['./case-tooltip.component.less'],
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({opacity: 0}),
        animate(300, style({opacity: 1})),
      ]),
      transition(':leave', [
        animate(300, style({opacity: 0})),
      ]),
    ]),
  ],
})
export class CaseTooltipComponent implements OnInit {

  @Input()
  public data: RKICaseDevelopmentProperties;

  @Input()
  public options: CovidNumberCaseOptions;

  currentTimedStatus: RKICaseTimedStatus;

  constructor(private caseUtil: CaseUtilService) {}



  ngOnInit(): void {
    this.currentTimedStatus = this.caseUtil.getTimedStatusWithOptions(this.data, this.options);
  }

}

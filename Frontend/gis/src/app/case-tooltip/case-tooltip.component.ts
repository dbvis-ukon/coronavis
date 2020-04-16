import { animate, style, transition, trigger } from "@angular/animations";
import { Component, Input, OnInit } from '@angular/core';
import { CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from '../services/types/quantitative-aggregated-rki-cases-over-time';

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
  public data: QuantitativeAggregatedRkiCasesOverTimeProperties;

  @Input()
  public options: CovidNumberCaseOptions;

  constructor() {}

  

  ngOnInit(): void {
  }

}

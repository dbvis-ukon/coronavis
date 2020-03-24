import {Component, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from "@angular/animations";
import { PlusminusPipe } from '../plusminus.pipe';

@Component({
  selector: 'app-case-tooltip',
  templateUrl: './case-tooltip.component.html',
  styleUrls: ['./case-tooltip.component.css'],
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

  public name: String;
  public combined: [{ cases: number, deaths: number }, { cases: number, deaths: number }, { cases: number, deaths: number }];
  public datum: String;
  public einwohner: number;

  constructor() {}

  public getCasesPer100kInhabitants(count: number): string {
    const v = ((count / this.einwohner) * 100000);

    return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
  }

  public getPercentageChange(curr: number, old: number): string {
    if (curr === old) {
      return "0%";
    }
    const change = ((curr - old) / old) * 100;
    if (change === Infinity) {
      return ("war 0");
    }
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  ngOnInit(): void {
  }

}

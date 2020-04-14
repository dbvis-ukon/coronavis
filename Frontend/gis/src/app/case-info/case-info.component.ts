import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from '../services/types/quantitative-aggregated-rki-cases-over-time';

@Component({
  selector: 'app-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.less'],
  providers: [DecimalPipe]
})
export class CaseInfoComponent implements OnInit {

  @Input()
  public data: QuantitativeAggregatedRkiCasesOverTimeProperties;

  constructor(private numberPipe: DecimalPipe) { }

  ngOnInit(): void {
  }

  public getCasesPer100kInhabitants(count: number, addPlus: boolean = false): string {
    const v = ((count / this.data.bevoelkerung) * 100000);

    return `${v > 0 && addPlus ? '+' : ''}${this.numberPipe.transform(v, '1.0-2')}`;
  }

  public getPercentageChange(curr: number, old: number): string {
    if (curr === old) {
      return "0%";
    }
    const change = ((curr - old) / old) * 100;
    if (change === Infinity) {
      return ("war 0");
    }
    return `${change > 0 ? '+' : ''}${this.numberPipe.transform(change, '1.0-1')}%`
  }

}

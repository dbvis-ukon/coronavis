import { Component, OnInit, Input } from '@angular/core';
import { trigger, animate, transition, style } from '@angular/animations';
import { QualitativeTimedStatusAggregation } from '../services/types/qualitateive-timed-status-aggregation';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { VegaBarchartService } from '../services/vega-barchart.service';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-bed-tooltip',
  templateUrl: './bed-tooltip.component.html',
  styleUrls: ['./bed-tooltip.component.less'],
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(300, style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate(300, style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class BedTooltipComponent implements OnInit {

  @Input()
  data: QualitativeTimedStatusAggregation;

  @Input()
  bedName: string;

  @Input()
  accessorFunc: (d: QualitativeTimedStatusAggregation) => QualitativeAggregatedBedStateCounts;

  @Input()
  explanation: string;


  spec: any;

  constructor(
    private vegaBarchartService: VegaBarchartService,
    private translationService: TranslationService
  ) { }

  ngOnInit(): void {

    this.spec = this.vegaBarchartService.compileChart(this.data, this.accessorFunc, null, {
      xAxisTitle: '',
      yAxisTitle: this.translationService.translate('Anzahl Krankenhäuser'),
      width: 100
    });
  }

}

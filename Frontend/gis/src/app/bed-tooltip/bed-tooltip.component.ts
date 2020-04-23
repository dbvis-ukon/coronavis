import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { TranslationService } from '../services/translation.service';
import { VegaBarchartService } from '../services/vega-barchart.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BedTooltipComponent implements OnInit {

  @Input()
  data: QualitativeTimedStatus;

  @Input()
  bedName: string;

  @Input()
  accessorFunc: (d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts;

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

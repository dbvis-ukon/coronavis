import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { HospitalUtilService } from '../services/hospital-util.service';

@Component({
  selector: 'app-glyph-tooltip',
  templateUrl: './glyph-tooltip.component.html',
  styleUrls: ['./glyph-tooltip.component.less'],
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


export class GlyphTooltipComponent implements OnInit {

  @Input()
  tooltipData: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>;

  isSingleHospital = false;

  totalNumberOfHospitals = 0;

  constructor(
    private hospitalUtilService: HospitalUtilService
  ) {
  }

  ngOnInit(): void {
    this.isSingleHospital = this.hospitalUtilService.isSingleHospital(this.tooltipData);

    if(!this.isSingleHospital) {
      this.totalNumberOfHospitals = this.hospitalUtilService.getNumberOfHospitals(this.tooltipData as AggregatedHospitalOut<QualitativeTimedStatus>);
    }
    
  }

}

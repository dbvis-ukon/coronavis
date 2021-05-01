import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { EbrakeItem } from 'src/app/repositories/ebrake.repository';
import { getMoment } from 'src/app/util/date-util';

@Component({
  selector: 'app-ebrake-tooltip',
  templateUrl: './ebrake-tooltip.component.html',
  styleUrls: ['./ebrake-tooltip.component.less'],
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
export class EbrakeTooltipComponent implements OnInit {

  @Input()
  public data: EbrakeItem & {ts_parsed: Date};

  constructor() {}

  ngOnInit(): void {
  }

  isPrognosis(): boolean {
    return getMoment(this.data.timestamp).isAfter(getMoment('now'));
  }

}

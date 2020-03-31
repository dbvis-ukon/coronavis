import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import { QuantitativeColormapService } from '../services/quantiataive-colormap.service';
import { DiviHospital } from '../services/types/divi-hospital';

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
  diviHospital: DiviHospital;
  name: string;

  constructor(private colormapService: QuantitativeColormapService) {
  }

  ngOnInit() {
  }

}

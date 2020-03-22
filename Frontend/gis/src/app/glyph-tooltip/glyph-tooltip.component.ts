import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {DiviHospital} from '../services/divi-hospitals.service';
import {SimpleGlyphLayer} from '../map/overlays/simple-glyph.layer';
import * as d3 from 'd3';

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


  readonly backgroundColScale =
    d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range(['white', '#333', 'white', 'white']);

  getCapacityStateColor(capacityState: string): string {
    return SimpleGlyphLayer.colorScale(capacityState);
  }

  constructor() { }

  ngOnInit() {
  }

}

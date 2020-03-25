import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {DiviAggregatedHospital} from '../services/divi-hospitals.service';
import * as d3 from 'd3';
import { ColormapService } from '../services/colormap.service';

@Component({
  selector: 'app-aggregated-glyph-tooltip',
  templateUrl: './aggregated-glyph-tooltip.component.html',
  styleUrls: ['./aggregated-glyph-tooltip.component.less'],
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


export class AggregatedGlyphTooltipComponent implements OnInit {

  @Input()
  diviAggregatedHospital: DiviAggregatedHospital;
  name: string;


  readonly backgroundColScale =
    d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range(['white', '#333', 'white', 'white']);

  constructor(private colormapService: ColormapService) {
  }

  ngOnInit() {
  }

  getCapacityStateColor(capacityState: string): string {
    return this.colormapService.getSingleHospitalColormap()(capacityState);
  }
}

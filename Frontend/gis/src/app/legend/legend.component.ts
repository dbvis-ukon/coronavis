import {Component, Input, OnInit} from '@angular/core';
import {ColormapService} from '../services/colormap.service';
import {AggregationLevel} from '../map/options/aggregation-level';
import {GlyphState} from '../map/options/glyph-state';

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.less']
})
export class LegendComponent implements OnInit {

  /**
  private _aggregationLevel: AggregationLevel;
  private _bedStatus: GlyphState;

  @Input()
  set aggregationLevel(val: AggregationLevel) {
    this._aggregationLevel = val;
  }

  get aggregationLevel(): AggregationLevel {
    return this._aggregationLevel;
  }

  @Input()
  set bedType(state: GlyphState) {
    this._bedStatus = state;
  }

  get bedType(): GlyphState {
    return this._bedStatus;
  }
   **/

  @Input()
  bedType: GlyphState;

  @Input()
  aggregationLevel: AggregationLevel;

  agg = AggregationLevel;
  bed = GlyphState;

  constructor(private colmapService: ColormapService) {

  }

  ngOnInit(): void {
  }

}

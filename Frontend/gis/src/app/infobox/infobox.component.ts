import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { AggregationLevel } from '../map/map.component';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  constructor() { }
  
  infoboxExtended = true;

  @Input()
  aggregationLevel: AggregationLevel;

  @Output()
  aggregationLevelChange: EventEmitter<AggregationLevel> = new EventEmitter();

  ngOnInit(): void {
  }

  emitAggregationLevel(evt) {
    this.aggregationLevelChange.emit(evt.value);
  }

}

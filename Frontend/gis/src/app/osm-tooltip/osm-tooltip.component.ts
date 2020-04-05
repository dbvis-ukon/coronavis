import { animate, style, transition, trigger } from "@angular/animations";
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-osm-tooltip',
  templateUrl: './osm-tooltip.component.html',
  styleUrls: ['./osm-tooltip.component.less'],
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

export class OsmTooltipComponent implements OnInit {

  public name: string;
  public type: string;

  constructor() { }
  

  ngOnInit(): void {

  }

  getOsmObjectName(){
    return this.name == null ? 'Name Unbekannt' : this.name;
  }

  getOsmObjectType(){
    return this.type === "helipad" ? "Helikopterlandeplatz" : "Krankenhaus";
  }

}

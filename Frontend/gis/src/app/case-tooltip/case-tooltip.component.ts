import { Component, OnInit } from '@angular/core';
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-case-tooltip',
  templateUrl: './case-tooltip.component.html',
  styleUrls: ['./case-tooltip.component.css'],
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
export class CaseTooltipComponent implements OnInit {

  public name: String;
  public combined: [];
  public datum: String;

  constructor() { }

  ngOnInit(): void {
  }

}

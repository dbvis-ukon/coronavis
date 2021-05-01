import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-source',
  templateUrl: './data-source.component.html',
  styleUrls: ['./data-source.component.less']
})
export class DataSourceComponent implements OnInit {

  @Input()
  source: 'rki' | 'risklayer' | 'divi' | 'zensus' | 'survstat' | 'rki_incidences';

  @Input()
  hideHint = false;

  now = new Date();

  constructor() { }

  ngOnInit(): void {
  }

}

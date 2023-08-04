import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-source',
  templateUrl: './data-source.component.html',
  styleUrls: ['./data-source.component.less']
})
export class DataSourceComponent {

  @Input()
  source: 'rki' | 'risklayer' | 'divi' | 'zensus' | 'survstat' | 'rki_incidences';

  @Input()
  hideHint = false;

  now = new Date();

}

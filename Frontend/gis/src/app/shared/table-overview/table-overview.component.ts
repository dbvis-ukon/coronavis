import { Component, Input } from '@angular/core';
import { CovidNumberCaseTimeWindow } from 'src/app/map/options/covid-number-case-options';
import { TableOverviewDataAndOptions } from 'src/app/services/table-overview.service';

@Component({
  selector: 'app-table-overview',
  templateUrl: './table-overview.component.html',
  styleUrls: ['./table-overview.component.less']
})
export class TableOverviewComponent {

  @Input()
  tableData: TableOverviewDataAndOptions;

  @Input()
  tooltip = false;

  @Input()
  showTitle = true;


  eTimeWindow = CovidNumberCaseTimeWindow;

}

import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { TableOverviewDataAndOptions } from 'src/app/services/table-overview.service';

@Component({
  selector: 'app-table-overview',
  templateUrl: './table-overview.component.html',
  styleUrls: ['./table-overview.component.less']
})
export class TableOverviewComponent implements OnInit {

  @Input()
  tableData$: Observable<TableOverviewDataAndOptions>;

  tooltip = false;

  constructor() { }

  ngOnInit(): void {}
}

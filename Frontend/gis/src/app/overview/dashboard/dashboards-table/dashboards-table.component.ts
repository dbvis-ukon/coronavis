import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Dashboard } from 'src/app/repositories/types/in/dashboard';

@Component({
  selector: 'app-dashboards-table',
  templateUrl: './dashboards-table.component.html',
  styleUrls: ['./dashboards-table.component.less']
})
export class DashboardsTableComponent {

  @Input()
  dashboards: Observable<Dashboard[]>;

  displayedColumns: string[] = ['title', 'upvotes', 'visits', 'created'];

}

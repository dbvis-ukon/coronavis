import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardRepository } from 'src/app/repositories/dashboard.repository';
import { Dashboard } from 'src/app/repositories/types/in/dashboard';

@Component({
  selector: 'app-dashboards-overview',
  templateUrl: './dashboards-overview.component.html',
  styleUrls: ['./dashboards-overview.component.less']
})
export class DashboardsOverviewComponent implements OnInit {

  mostVisited$: Observable<Dashboard[]>;
  mostUpvoted$: Observable<Dashboard[]>;
  newest$: Observable<Dashboard[]>;

  constructor(private dashboardRepo: DashboardRepository) { }

  ngOnInit(): void {
    this.mostVisited$ = this.dashboardRepo.getMostVisited();
    this.mostUpvoted$ = this.dashboardRepo.getMostUpvoted();
    this.newest$ = this.dashboardRepo.getNewest();
  }

}

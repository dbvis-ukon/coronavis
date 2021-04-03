import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { DashboardRepository } from 'src/app/repositories/dashboard.repository';
import { Dashboard } from 'src/app/repositories/types/in/dashboard';
import { Region } from 'src/app/repositories/types/in/region';

@Component({
  selector: 'app-dashboards-overview',
  templateUrl: './dashboards-overview.component.html',
  styleUrls: ['./dashboards-overview.component.less']
})
export class DashboardsOverviewComponent implements OnInit {

  selectedRegions: Region[] = [{id: '08335', name: 'Landkreis Konstanz', aggLevel: AggregationLevel.county, description: ''}];

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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { filter, mergeMap, toArray } from 'rxjs/operators';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { EbrakeItem, EbrakeRepository } from 'src/app/repositories/ebrake.repository';
import { RegionRepository } from 'src/app/repositories/region.repository';
import { Region } from 'src/app/repositories/types/in/region';
import { getMoment, getStrDate } from 'src/app/util/date-util';

@Component({
  selector: 'app-temporal-overview',
  templateUrl: './temporal-overview.component.html',
  styleUrls: ['./temporal-overview.component.less']
})
export class TemporalOverviewComponent implements OnInit {

  data: EbrakeItem[];
  activeRegions: Region[] = [];

  constructor(
    private ebrakeRepo: EbrakeRepository,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private regionRepo: RegionRepository) { }

  ngOnInit(): void {

    this.activatedRoute.queryParams.subscribe(p => {
      if (p.ids) {
        const r: string[] = p.ids.split(',');

        this.regionRepo.getAll()
        .pipe(
          mergeMap(d => d),
          filter(reg => ((reg.id.length === 2 && reg.aggLevel === AggregationLevel.state) || reg.id.length !==2) && r.find(r1 => r1 === reg.id) !== undefined),
          toArray()
        )
        .subscribe(regions => {
          this.activeRegions = regions;
          this.updateChart(regions);
        });

      } else {
        this.activeRegions = [];
        this.updateChart();
      }
    });
  }

  updateRegions(regions: Region[]): void {
    let params: Params = {};

    if (regions.length > 0) {
      params = {ids: regions.map(d => d.id).join(',')};
    }

    this.router.navigate(
      [],
      {
        relativeTo: this.activatedRoute,
        queryParams: params
      });
  }

  updateChart(regions?: Region[]): void {
    this.ebrakeRepo.getEbrakeData(getStrDate(getMoment('now').subtract(14, 'days')))
    .pipe(
      mergeMap(d => d.data),
      filter(d => (!regions || regions.length === 0) || (regions && regions.find(r => d.id.startsWith(r.id)) !== undefined)),
      toArray()
    )
    .subscribe(d => this.data = d);
  }

}

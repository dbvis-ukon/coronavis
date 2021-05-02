import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { filter, map, mergeMap, toArray } from 'rxjs/operators';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { EbrakeData, EbrakeRepository } from 'src/app/repositories/ebrake.repository';
import { RegionRepository } from 'src/app/repositories/region.repository';
import { Region } from 'src/app/repositories/types/in/region';
import { getMoment, getStrDate } from 'src/app/util/date-util';

@Component({
  selector: 'app-temporal-overview',
  templateUrl: './temporal-overview.component.html',
  styleUrls: ['./temporal-overview.component.less']
})
export class TemporalOverviewComponent implements OnInit {

  data: EbrakeData;
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
      map(d => {
        const filteredData = d.data.filter(d1 => (!regions || regions.length === 0) || (regions && regions.find(r => d1.id.startsWith(r.id)) !== undefined));
        return {...d, data: filteredData} as EbrakeData;
      }),
    )
    .subscribe(d => this.data = d);
  }

}

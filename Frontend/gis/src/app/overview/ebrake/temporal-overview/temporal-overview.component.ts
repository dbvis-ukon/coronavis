import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { EbrakeData, EbrakeRepository } from 'src/app/repositories/ebrake.repository';
import { RegionRepository } from 'src/app/repositories/region.repository';
import { Region } from 'src/app/repositories/types/in/region';
import { getMoment, getStrDate } from 'src/app/util/date-util';
import { EbrakeShareDialogComponent } from '../ebrake-share-dialog/ebrake-share-dialog.component';

@Component({
  selector: 'app-temporal-overview',
  templateUrl: './temporal-overview.component.html',
  styleUrls: ['./temporal-overview.component.less']
})
export class TemporalOverviewComponent implements OnInit {

  data: EbrakeData;
  activeRegions: Region[] = [];

  showButtons = true;
  showRegions = true;
  showFooter = true;

  constructor(
    private ebrakeRepo: EbrakeRepository,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private regionRepo: RegionRepository,
    private matDialog: MatDialog) { }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(d => {
      if (d.showButtons === false) {
        this.showButtons = false;
      }
    });

    this.activatedRoute.queryParams.subscribe(p => {
      this.showRegions = p.regions === 'false' ? false : true;
      this.showFooter = p.footer === 'false' ? false : true;

      if (p.ids) {
        const r: string[] = p.ids.split(',');

        this.regionRepo.getByIds(r)
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
        queryParams: params,
        queryParamsHandling: 'merge'
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

  openShareDialog(): void {
    this.matDialog.open(EbrakeShareDialogComponent, {data: {regions: JSON.parse(JSON.stringify(this.activeRegions))}});
  }

}

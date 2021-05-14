import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { EbrakeData, EbrakeRepository } from 'src/app/repositories/ebrake.repository';
import { RegionRepository } from 'src/app/repositories/region.repository';
import { Region } from 'src/app/repositories/types/in/region';
import { MyLocalStorageService } from 'src/app/services/my-local-storage.service';
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
  numPastDays = null;
  numFutureDays = null;

  constructor(
    private ebrakeRepo: EbrakeRepository,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private regionRepo: RegionRepository,
    private matDialog: MatDialog,
    private localStorageService: MyLocalStorageService,
    private observer: BreakpointObserver) { }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(d => {
      if (d.showButtons === false) {
        this.showButtons = false;
      }
    });

    this.activatedRoute.queryParams.subscribe(p => {
      this.showRegions = p.regions === 'false' ? false : true;
      this.showFooter = p.footer === 'false' ? false : true;
      this.numPastDays = p.numPastDays ? parseInt(p.numPastDays + '', 10) : null;
      this.numFutureDays = p.numFutureDays ? parseInt(p.numFutureDays + '', 10) : null;

      if (p.ids) {
        const r: string[] = p.ids.split(',');

        this.localStorageService.store('ebrake_regions', p.ids);

        this.regionRepo.getByIds(r)
        .subscribe(regions => {
          this.activeRegions = regions;
          this.updateChart(regions);
        });

      } else if (this.localStorageService.retrieve('ebrake_regions')) {
        const r: string[] = this.localStorageService.retrieve('ebrake_regions').split(',');

        this.regionRepo.getByIds(r)
        .subscribe(regions => {
          this.updateRegions(regions);
        });
      } else {
        this.activeRegions = [];
        this.localStorageService.clear('ebrake_regions');
        this.updateChart();
      }
    });
  }

  updateRegions(regions: Region[]): void {
    let params: Params = {};

    const idsStr = regions.map(d => d.id).join(',');
    if (regions.length > 0) {
      params = {ids: idsStr};
      this.localStorageService.store('ebrake_regions', idsStr);
    } else {
      this.localStorageService.clear('ebrake_regions');
      params = {ids: null};
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
    let numPastDays: number = null;
    if (this.numPastDays === null && this.observer.isMatched('(max-width: 300px)')) {
      numPastDays = 5;
    } else if (this.numPastDays === null && this.observer.isMatched('(max-width: 400px)')) {
      numPastDays = 7;
    } else if (this.numPastDays === null && this.observer.isMatched('(max-width: 600px)')) {
      numPastDays = 10;
    } else if (this.numPastDays === null) {
      numPastDays = 14;
    } else {
      numPastDays = this.numPastDays;
    }

    let numFutureDays: number = null;
    if (this.numFutureDays === null) {
      numFutureDays = 7;
    } else {
      numFutureDays = this.numFutureDays;
    }
    const from = getStrDate(getMoment('now').subtract(numPastDays, 'days'));
    const to = getStrDate(getMoment('now').add(numFutureDays, 'days'));
    this.ebrakeRepo.getEbrakeData(from, to, regions?.map(d => d.id))
    // .pipe(
    //   map(d => {
    //     const filteredData = d.data.filter(d1 => (!regions || regions.length === 0) || (regions && regions.find(r => d1.id.startsWith(r.id)) !== undefined));
    //     return {...d, data: filteredData} as EbrakeData;
    //   }),
    // )
    .subscribe(d => this.data = d);
  }

  openShareDialog(): void {
    this.matDialog.open(EbrakeShareDialogComponent, {data: {regions: JSON.parse(JSON.stringify(this.activeRegions))}});
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateChart(this.activeRegions);
  }

}

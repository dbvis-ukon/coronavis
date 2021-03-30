import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { merge } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, mergeMap, toArray } from 'rxjs/operators';
import { AgeGroupBinning } from '../cases-dod/covid-chart-options';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseDataSource, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { RegionRepository } from '../repositories/region.repository';
import { Dashboard } from '../repositories/types/in/dashboard';
import { Region } from '../repositories/types/in/region';
import { Item, MarkdownItem, MultiLineChartItem, PixelChartItem, TableOverviewItem } from './chart.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService implements Resolve<Dashboard> {

  private alreadyUpvoted: Set<string> = new Set();

  constructor(
    private regionRepo: RegionRepository,
    private configService: ConfigService,
    private dashboardRepo: DashboardRepository
  ) {}


  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Dashboard | Observable<Dashboard> | Promise<Dashboard> {
    const id = route.paramMap.get('id');

    return this.resolveDashboard(id);
  }

  public resolveDashboard(idOrAgs: string): Observable<Dashboard> {
    if (idOrAgs.length <= 5) {
      return this.createFromAgs(idOrAgs).pipe(
        catchError(() => this.get404())
      );
    } else {
      return this.dashboardRepo.get(idOrAgs).pipe(
        catchError(() => this.get404())
      );
    }
  }

  public createFromAgs(ags: string): Observable<Dashboard> {
    const regions = [];

    if (ags === 'de') {
      regions.push('de');
    } else if (ags.length === 2) {
      regions.push(ags);
      regions.push('de');
    } else if (ags.length === 3) {
      regions.push(ags);
      regions.push('de');
    } else {
      regions.push(ags);
      regions.push(ags.substring(0, 2));
      regions.push('de');
    }


    return this.regionRepo.getAll()
    .pipe(
      mergeMap(d => d),
      filter(d => regions.indexOf(d.id) > -1),
      toArray(),
      map(dataRequests => {
        const rRegion = dataRequests.find(d => d.id === ags);
        const name = (rRegion.description ? rRegion.description + ' ' : '') + rRegion.name;
        const dashboard: Dashboard = {
          id: ags,
          title: name + ' (automatic)',
          visits: 1,
          upvotes: 0,
          items: []
        };

        dashboard.items.push({
          type:'markdown',
          text: `# Auto-generated dashboard

This is an automatically generated dashboard based on ${name}. Feel free to modify anything here.
If you save this dashboard, it will receive a new ID and URL.

> With :heart: from [@dbvis](https://twitter.com/dbvis)`
        } as MarkdownItem);

        dashboard.items.push({
          type: 'table',
          dataRequest: [rRegion],
          config: this.configService.getDefaultChartConfig('table')
        } as TableOverviewItem);

        dashboard.items.push({
          type: 'multiline',
          dataRequest: dataRequests,
          config: this.configService.getDefaultChartConfig('multiline')
        } as MultiLineChartItem);

        dashboard.items.push({
          type: 'multiline',
          dataRequest: dataRequests,
          config: this.configService.parseConfig(
            merge(this.configService.getDefaultChartConfig('multiline'), {type: CovidNumberCaseType.patients}),
            'multiline',
            true
          ).config
        });

        dashboard.items.push({
          type: 'multiline',
          dataRequest: dataRequests,
          config: this.configService.parseConfig(
            merge(this.configService.getDefaultChartConfig('multiline'), {type: CovidNumberCaseType.bedOccupancyPercent}),
            'multiline',
            true
          ).config
        });

        dashboard.items.push({
          type: 'pixel',
          dataRequest: [rRegion],
          config: this.configService.parseConfig(
            merge(this.configService.getDefaultChartConfig('pixel'), {type: CovidNumberCaseType.cases, dataSource: CovidNumberCaseDataSource.survstat, ageGroupBinning: AgeGroupBinning.fiveyears}),
            'pixel',
            true
          ).config
        });

        return dashboard;
      })
    );
  }

  save(dashboard: Dashboard): Observable<Dashboard> {
    const newDashboard: Dashboard = {id: dashboard.id, title: dashboard.title, upvotes: null, visits: null, items: []};

    dashboard.items.forEach(i => newDashboard.items.push({
      type: i.type,
      text: (i as MarkdownItem).text,
      dataRequest: (i as PixelChartItem).dataRequest,
      config: (i as PixelChartItem).config
    } as Item));
    return this.dashboardRepo.save(newDashboard);
  }

  get404(): Observable<Dashboard> {
    const dashboard: Dashboard = {
      id: '404',
      title: '404 Dashboard not found',
      visits: 0,
      upvotes: 0,
      items: []
    };

    dashboard.items.push({
      type:'markdown',
      text: `# We could not find this dashboard

We could not find the dashboard you are looking for. You can search again or start here and add some more charts.

> With :heart: from [@dbvis](https://twitter.com/dbvis)`
    } as MarkdownItem);

    const r: Region[] = [{id: 'de', name: 'Deutschland', aggLevel: AggregationLevel.country, description: ''}];

    dashboard.items.push({
      type: 'table',
      config: this.configService.getDefaultChartConfig('table'),
      dataRequest: r
    });

    dashboard.items.push({
      type: 'multiline',
      config: this.configService.getDefaultChartConfig('multiline'),
      dataRequest: r
    });

    dashboard.items.push({
      type: 'multiline',
      dataRequest: r,
      config: this.configService.parseConfig(
        merge(this.configService.getDefaultChartConfig('multiline'), {type: CovidNumberCaseType.patients}),
        'multiline',
        true
      ).config
    });

    dashboard.items.push({
      type: 'multiline',
      dataRequest: r,
      config: this.configService.parseConfig(
        merge(this.configService.getDefaultChartConfig('multiline'), {type: CovidNumberCaseType.bedOccupancyPercent}),
        'multiline',
        true
      ).config
    });

    dashboard.items.push({
      type: 'pixel',
      config: this.configService.getDefaultChartConfig('pixel'),
      dataRequest: r
    });

    return of(dashboard);
  }

  upvote(dashboard: Dashboard): Observable<Dashboard> {
    if (this.alreadyUpvoted.has(dashboard.id) || dashboard.id.length < 6) {
      return of(dashboard);
    }

    this.alreadyUpvoted.add(dashboard.id);
    return this.dashboardRepo.upvote(dashboard.id);
  }

}

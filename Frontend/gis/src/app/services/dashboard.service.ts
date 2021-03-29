import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { merge } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { filter, map, mergeMap, toArray } from 'rxjs/operators';
import { AgeGroupBinning, ScaleType, TimeGranularity } from '../cases-dod/covid-chart-options';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseChange, CovidNumberCaseDataSource, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { RegionRepository } from '../repositories/region.repository';
import { Dashboard } from '../repositories/types/in/dashboard';
import { Item, MarkdownItem, MultiLineChartItem, TableOverviewItem } from './chart.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService implements Resolve<Dashboard> {

  constructor(
    private regionRepo: RegionRepository,
    private configService: ConfigService
  ) {}


  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Dashboard | Observable<Dashboard> | Promise<Dashboard> {
    const id = route.paramMap.get('id');

    return this.resolveDashboard(id);
  }

  public resolveDashboard(idOrAgs: string): Observable<Dashboard> {
    if (idOrAgs.length <= 5) {
      return this.createFromAgs(idOrAgs);
    } else {
      return this.getExample();
    }
  }

  public createFromAgs(ags: string): Observable<Dashboard> {
    let aggLevel: AggregationLevel;

    const regions = [];

    if (ags === 'de') {
      aggLevel = AggregationLevel.country;
      regions.push('de');
    } else if (ags.length === 2) {
      aggLevel = AggregationLevel.state;

      regions.push(ags);
      regions.push('de');
    } else if (ags.length === 3) {
      aggLevel = AggregationLevel.governmentDistrict;

      regions.push(ags);
      regions.push('de');
    } else {
      aggLevel = AggregationLevel.county;

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

  public getExample(): Observable<Dashboard> {
    const items: Item[] = [
      {
        type: 'markdown',
        text: `# CoronaVis Dashboards
  
  In dieser Version können Benutzer selbständig Dashboards generieren, anpassen und über URLs teilen.
  Zusätzlich zu den Charts können Textblöcke mit Markdown eingefügt werden um Erklärungen zu schreiben.
  
  ## Funktioniert bereits:
  - Markdown bearbeiten
  - Charts editieren (work-in-progress)
  - Charts löschen
  - Charts neu anordnen
  - Multi-Series-Linechart mit Inzidenzen
  - Inzidenzen nach Altersgruppen
  
  ## Todo:
  - Dashboards persistent speichern
  - Charts editieren
  - Neue Charts und Text Elemente hinzufügen
  - Multi-Series-Linechart erweitern für Bettenkapazitäten, Covid-19 Patienten, Todesfälle
  - Tabellen-Chart
        `
      },
      // {
      //   type: 'multiline',
      //   dataRequest: [
      //     {
      //       id: '01',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '02',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '03',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '04',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '05',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '06',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '07',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '08',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '09',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '10',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '11',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '12',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '13',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '14',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '15',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: '16',
      //       aggLevel: AggregationLevel.state
      //     },
      //     {
      //       id: 'de',
      //       aggLevel: AggregationLevel.country
      //     }
      //   ],
      //   config: {
      //     change: CovidNumberCaseChange.absolute,
      //     dataSource: 'rki',
      //     date: 'now',
      //     daysForTrend: 7,
      //     normalization: CovidNumberCaseNormalization.per100k,
      //     scaleType: ScaleType.linear,
      //     ageGroupBinning: AgeGroupBinning.fiveyears,
      //     showLabels: true,
      //     showOnlyAvailableCounties: true,
      //     showTrendGlyphs: true,
      //     timeAgg: TimeGranularity.yearmonthdate,
      //     timeWindow: CovidNumberCaseTimeWindow.sevenDays,
      //     type: CovidNumberCaseType.cases
      //   }
      // },
      {
        type: 'multiline',
        dataRequest: [
          {
            id: '08335',
            aggLevel: AggregationLevel.county,
            name: 'Konstanz',
            description: 'Landkreis'
          },
          {
            id: '08',
            aggLevel: AggregationLevel.state,
            name: 'Baden-Württemberg',
            description: 'BL'
          },
          {
            id: 'de',
            aggLevel: AggregationLevel.country,
            name: 'Germany',
            description: 'L'
          }
        ],
        config: {
          change: CovidNumberCaseChange.absolute,
          dataSource: CovidNumberCaseDataSource.risklayer,
          date: 'now',
          daysForTrend: 7,
          normalization: CovidNumberCaseNormalization.per100k,
          scaleType: ScaleType.linear,
          ageGroupBinning: AgeGroupBinning.fiveyears,
          showLabels: true,
          showOnlyAvailableCounties: true,
          showTrendGlyphs: true,
          timeAgg: TimeGranularity.yearmonthdate,
          timeWindow: CovidNumberCaseTimeWindow.sevenDays,
          type: CovidNumberCaseType.cases
        }
      },
      {
        type: 'pixel',
        dataRequest: [
          {
            id: '08335',
            aggLevel: AggregationLevel.county,
            name: 'Konstanz',
            description: 'Landkreis'
          },
          {
            id: '08336',
            aggLevel: AggregationLevel.county,
            name: 'Lörrach',
            description: 'Landkreis'
          }
        ],
        config: {
          change: CovidNumberCaseChange.absolute,
          dataSource: CovidNumberCaseDataSource.rki,
          date: 'now',
          daysForTrend: 7,
          normalization: CovidNumberCaseNormalization.per100k,
          scaleType: ScaleType.linear,
          ageGroupBinning: AgeGroupBinning.fiveyears,
          showLabels: true,
          showOnlyAvailableCounties: true,
          showTrendGlyphs: true,
          timeAgg: TimeGranularity.yearmonthdate,
          timeWindow: CovidNumberCaseTimeWindow.sevenDays,
          type: CovidNumberCaseType.cases
        }
      },
      {
        type: 'pixel',
        dataRequest: [
          {
            id: '08',
            aggLevel: AggregationLevel.state,
            name: 'Baden-Württemberg',
            description: 'BL'
          }
        ],
        config: {
          change: CovidNumberCaseChange.absolute,
          dataSource: CovidNumberCaseDataSource.rki,
          date: 'now',
          daysForTrend: 7,
          normalization: CovidNumberCaseNormalization.per100k,
          ageGroupBinning: AgeGroupBinning.fiveyears,
          scaleType: ScaleType.linear,
          showLabels: true,
          showOnlyAvailableCounties: true,
          showTrendGlyphs: true,
          timeAgg: TimeGranularity.yearmonthdate,
          timeWindow: CovidNumberCaseTimeWindow.sevenDays,
          type: CovidNumberCaseType.cases
        }
      },
      // {
      //   type: 'pixel',
      //   dataRequest: [
      //     {
      //       id: 'de',
      //       aggLevel: AggregationLevel.country,
      //       name: 'Germany',
      //       description: 'L'
      //     }
      //   ],
      //   config: {
      //     change: CovidNumberCaseChange.absolute,
      //     dataSource: 'rki',
      //     date: 'now',
      //     daysForTrend: 7,
      //     normalization: CovidNumberCaseNormalization.per100k,
      //     ageGroupBinning: AgeGroupBinning.fiveyears,
      //     scaleType: ScaleType.linear,
      //     showLabels: true,
      //     showOnlyAvailableCounties: true,
      //     showTrendGlyphs: true,
      //     timeAgg: TimeGranularity.yearmonthdate,
      //     timeWindow: CovidNumberCaseTimeWindow.sevenDays,
      //     type: CovidNumberCaseType.cases
      //   }
      // }
    ];

    return of({
      id: 'example',
      title: 'Example',
      items,
      upvotes: 100,
      visits: 404
    } as Dashboard);
  }

}

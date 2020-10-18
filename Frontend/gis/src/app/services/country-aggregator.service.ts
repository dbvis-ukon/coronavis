import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { getMoment, getStrDate } from '../util/date-util';
import { CaseUtilService } from './case-util.service';

@Injectable({
  providedIn: 'root'
})
export class CountryAggregatorService {

  private diviFilteredMap: Map<string, QualitativeTimedStatus> = new Map();
  private diviUnfilteredMap: Map<string, QualitativeTimedStatus> = new Map();

  constructor(
    private diviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private caseRepository: CaseDevelopmentRepository,
    private caseUtilService: CaseUtilService
  ) {
  }

  public rkiAggregationForCountry(dataSource: 'rki' | 'risklayer', refDate: string): Observable<RKICaseTimedStatus | undefined> {
    const from = getStrDate(getMoment(refDate).subtract(1, 'day'));
    const to = getStrDate(getMoment(refDate).add(1, 'day'));

    return this.caseRepository.getCasesDevelopmentForAggLevel(dataSource, AggregationLevel.country, from, to)
    .pipe(
      map(fc => this.caseUtilService.getTimedStatus(fc.features[0].properties, getMoment(refDate)))
    );
  }

  public diviAggregationForCountry(refDate: string): Observable<QualitativeTimedStatus> {
    return this.useCachedMap(refDate, this.diviFilteredMap, 5);
  }

  public diviAggregationForCountryUnfiltered(refDate: string): Observable<QualitativeTimedStatus> {
    return this.useCachedMap(refDate, this.diviUnfilteredMap, -1);
  }

  private useCachedMap(refDate: string, cache: Map<string, QualitativeTimedStatus>, lastNumberOfDays: number) {
    return of(cache)
    .pipe(
      concatMap(m => {
        if (!refDate) {
          refDate = 'now';
        }
        const t = getStrDate(getMoment(refDate));
        if (m.size === 0) {
          return this.fetchMap(cache, lastNumberOfDays)
          .pipe(
            map(fm => fm.get(t))
          );
        }

        // else
        return of(m.get(t));
      })
    );
  }

  private fetchMap(writeToCache: Map<string, QualitativeTimedStatus>, lastNumberOfDays: number): Observable<Map<string, QualitativeTimedStatus>> {
    return this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(AggregationLevel.country, getStrDate(getMoment('now').subtract(2, 'days')), 'now', lastNumberOfDays)
    .pipe(
      map(fc => fc.features[0]),
      map(feature => {
        const map1: Map<string, QualitativeTimedStatus> = new Map();

        feature.properties.developments.forEach(d => {
          const t = getStrDate(getMoment(d.timestamp));

          map1.set(t, d);
        });

        return map1;
      }),
      tap(m => writeToCache = m),
    );
  }

}

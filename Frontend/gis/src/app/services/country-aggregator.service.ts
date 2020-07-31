import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { concatMap, tap } from 'rxjs/operators';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { RKICaseDevelopmentRepository } from '../repositories/rki-case-development.repository';
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
    private rkiCaseRepository: RKICaseDevelopmentRepository,
    private caseUtilService: CaseUtilService
  ) {
  }

  public rkiAggregationForCountry(refDate: string): Observable<RKICaseTimedStatus | undefined> {
    return this.rkiCaseRepository.getCasesDevelopmentForCountries()
    .pipe(
      map(fc => this.caseUtilService.getTimedStatus(fc.features[0].properties, getMoment(refDate)))
    )
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
        if(!refDate) {
          refDate = 'now';
        }
        const t = getStrDate(getMoment(refDate));
        if(m.size === 0) {
          return this.fetchMap(cache, lastNumberOfDays)
          .pipe(
            map(fm => fm.get(t))
          )
        }

        // else
        return of(m.get(t));
      })
    );
  }

  private fetchMap(writeToCache: Map<string, QualitativeTimedStatus>, lastNumberOfDays: number): Observable<Map<string, QualitativeTimedStatus>> {
    return this.diviDevelopmentRepository.getDiviDevelopmentCountries('now', lastNumberOfDays)
    .pipe(
      map(fc => fc.features[0]),
      map(feature => {
        const map: Map<string, QualitativeTimedStatus> = new Map();

        feature.properties.developments.forEach(d => {
          const t = getStrDate(getMoment(d.timestamp));

          map.set(t, d);
        })

        return map;
      }),
      tap(m => writeToCache = m),
    )
  }

}

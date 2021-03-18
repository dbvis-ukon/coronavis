import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap, flatMap, map, tap } from 'rxjs/operators';
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
      map(fc => {
        if (fc.features.length === 0 || !fc.features[0]?.properties) {
          return undefined;
        }
        return this.caseUtilService.getTimedStatus(fc.features[0].properties, getMoment(refDate));
      })
    );
  }

  public diviAggregationForCountry(refDate: string): Observable<QualitativeTimedStatus> {
    return this.fetchDivi(refDate, 5);
  }

  public diviAggregationForCountryUnfiltered(refDate: string): Observable<QualitativeTimedStatus> {
    return this.fetchDivi(refDate, -1);
  }

  private fetchDivi(refDate: string, lastNumberOfDays: number): Observable<QualitativeTimedStatus> {
    const from = getStrDate(getMoment(refDate).subtract(1, 'day'));
    const to = getStrDate(getMoment(refDate).add(2, 'day'));

    return this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(AggregationLevel.country, from, to, lastNumberOfDays)
    .pipe(
      map(fc => fc.features[0]?.properties?.developmentDays[refDate]),
    );
  }

}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseDataSource } from '../map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { getDateTime, getStrDate } from '../util/date-util';
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

  public rkiAggregationForCountry(dataSource: CovidNumberCaseDataSource, refDate: string): Observable<RKICaseTimedStatus | undefined> {
    const from = getStrDate(getDateTime(refDate).minus({days: 1}));
    const to = getStrDate(getDateTime(refDate).plus({days: 1}));

    return this.caseRepository.getCasesDevelopmentForAggLevel(dataSource, AggregationLevel.country, from, to, false, true)
    .pipe(
      map(fc => {
        if (fc.features.length === 0 || !fc.features[0]?.properties) {
          return undefined;
        }
        return this.caseUtilService.getTimedStatus(fc.features[0].properties, getDateTime(refDate));
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
    const from = getStrDate(getDateTime(refDate).minus({days: 1}));
    const to = getStrDate(getDateTime(refDate).plus({days: 1}));

    return this.diviDevelopmentRepository.getDiviDevelopmentForAggLevel(AggregationLevel.country, from, to, true, lastNumberOfDays)
    .pipe(
      map(fc => fc.features[0]?.properties?.developmentDays[refDate]),
    );
  }

}

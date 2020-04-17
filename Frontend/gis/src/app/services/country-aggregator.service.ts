import { Injectable } from '@angular/core';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { flatMap, reduce, tap } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { RKICaseRepository } from '../repositories/rki-case.repository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QuantitativeAggregatedRkiCasesProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';

@Injectable({
  providedIn: 'root'
})
export class CountryAggregatorService {

  private diviFilteredMap: Map<string, QualitativeTimedStatus> = new Map();
  private diviUnfilteredMap: Map<string, QualitativeTimedStatus> = new Map();

  constructor(
    private diviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private rkiCaseRepository: RKICaseRepository
  ) {
  }

  public rkiAggregationForCountry(): Observable<QuantitativeAggregatedRkiCasesProperties> {
    return this.rkiCaseRepository.getCasesTotalForAggLevel(AggregationLevel.state)
    .pipe(
      flatMap(fc => fc.features),
      map(f => f.properties),
      reduce((agg, val) => {
        agg.bevoelkerung += val.bevoelkerung;
        agg.cases += val.cases
        agg.deaths += val.deaths;
        
        const aggT = new Date(agg.until);
        const valT = new Date(val.until);

        if(aggT < valT) {
          agg.until = valT;
        }

        return agg;
      }, {
        bevoelkerung: 0,
        cases: 0,
        deaths: 0,
        until: new Date('1990-01-01'),
        ids: null,
        name: null
      })
    );
  }

  public diviAggregationForCountry(refDate: Date): Observable<QualitativeTimedStatus> {
    return this.useCachedMap(refDate, this.diviFilteredMap, 5);
  }

  public diviAggregationForCountryUnfiltered(refDate: Date): Observable<QualitativeTimedStatus> {
    return this.useCachedMap(refDate, this.diviUnfilteredMap, -1);
  }

  private useCachedMap(refDate: Date, cache: Map<string, QualitativeTimedStatus>, lastNumberOfDays: number) {
    if(!refDate) {
      refDate = new Date();
    }
    const t = moment(refDate).format('YYYY-MM-DD');

    const cached = cache.get(t);

    if(cached) {
      return of(cached);
    }

    const uncached = this.fetchMap(cache, lastNumberOfDays)
    .pipe(
      map(map => {
        return map.get(t);
      }),
    );

    return uncached;
  }

  private fetchMap(writeToCache: Map<string, QualitativeTimedStatus>, lastNumberOfDays: number): Observable<Map<string, QualitativeTimedStatus>> {
    return this.diviDevelopmentRepository.getDiviDevelopmentCountries(new Date(), lastNumberOfDays)
    .pipe(
      map(fc => fc.features[0]),
      map(feature => {
        const map: Map<string, QualitativeTimedStatus> = new Map();

        feature.properties.developments.forEach(d => {
          const t = moment(d.timestamp).format('YYYY-MM-DD');

          map.set(t, d);
        })

        return map;
      }),
      tap(m => writeToCache = m),
    )
  }

}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { flatMap, reduce } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { RKICaseRepository } from '../repositories/rki-case.repository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QuantitativeAggregatedRkiCasesProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';
import { getLatestTimedStatus } from '../util/timestamped-value';
import { QualitativeColormapService } from './qualitative-colormap.service';
import { QualitativeTimedStatusAggregation } from './types/qualitateive-timed-status-aggregation';

@Injectable({
  providedIn: 'root'
})
export class CountryAggregatorService {

  constructor(
    private diviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private rkiCaseRepository: RKICaseRepository
  ) { }

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

  public diviAggregationForCountry(): Observable<QualitativeTimedStatusAggregation> {
    const beds = [
      'icu_low_care',
      'icu_high_care',
      'ecmo_state'
    ];

    return this.diviDevelopmentRepository.getDiviDevelopmentSingleHospitals()
    .pipe(
      flatMap(fc => fc.features),
      map(feature => getLatestTimedStatus<QualitativeTimedStatus>(feature.properties.developments)),
      reduce<QualitativeTimedStatus, QualitativeTimedStatusAggregation>((acc, val) => {
        for(const bed of beds) {
          if(!acc[bed]) {
            acc[bed] = {};
          }
          for(const stat of QualitativeColormapService.bedStati) {
            if(!acc[bed][stat]) {
              acc[bed][stat] = 0;
            }
            acc[bed][stat] += val[bed][stat] || 0;
          }
        }
        const accT = new Date(acc.timestamp);
        const valT = new Date(val.timestamp)
        if(accT < valT) {
          acc.timestamp = valT;
        }

        if(!acc.numberOfHospitals) {
          acc.numberOfHospitals = 0;
        }

        acc.numberOfHospitals += 1;

        return acc as QualitativeTimedStatusAggregation;
      },{
        timestamp: new Date('1990-01-01'),
        last_update: new Date('1990-01-01'),
        numberOfHospitals: 0,
        icu_low_care: {
          Verfügbar: 0,
          Begrenzt: 0,
          Ausgelastet: 0,
          "Nicht verfügbar": 0,
          "": 0
        },
        icu_high_care: {
          Verfügbar: 0,
          Begrenzt: 0,
          Ausgelastet: 0,
          "Nicht verfügbar": 0,
          "": 0
        },
        ecmo_state: {
          Verfügbar: 0,
          Begrenzt: 0,
          Ausgelastet: 0,
          "Nicht verfügbar": 0,
          "": 0
        }
      })
    );
  }
}

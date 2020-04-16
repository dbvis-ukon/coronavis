import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { flatMap, reduce } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { RKICaseRepository } from '../repositories/rki-case.repository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QuantitativeAggregatedRkiCasesProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';
import { HospitalUtilService } from './hospital-util.service';
import { QualitativeColormapService } from './qualitative-colormap.service';

@Injectable({
  providedIn: 'root'
})
export class CountryAggregatorService {

  constructor(
    private diviDevelopmentRepository: QualitativeDiviDevelopmentRepository,
    private rkiCaseRepository: RKICaseRepository,
    private hospitalUtil: HospitalUtilService
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

  public diviAggregationForCountry(refDate: Date): Observable<QualitativeTimedStatus> {
    const beds = [
      'icu_low_care',
      'icu_high_care',
      'ecmo_state'
    ];

    return this.diviDevelopmentRepository.getDiviDevelopmentSingleHospitals(refDate)
    .pipe(
      flatMap(fc => fc.features),
      map(feature => this.hospitalUtil.getLatestTimedStatus(feature.properties.developments, refDate)),
      reduce<QualitativeTimedStatus, QualitativeTimedStatus>((acc, val) => {
        if(!val) {
          return acc;
        }
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

        acc.numHospitals += 1;

        return acc as QualitativeTimedStatus;
      },{
        timestamp: new Date('1990-01-01'),
        last_update: new Date('1990-01-01'),
        numHospitals: 0,
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

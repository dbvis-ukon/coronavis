import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { BedType } from 'src/app/map/options/bed-type.enum';
import { MapLocationSettings } from 'src/app/map/options/map-location-settings';
import { MapOptions } from 'src/app/map/options/map-options';
import { ConfigService } from 'src/app/services/config.service';
import { CountryAggregatorService } from 'src/app/services/country-aggregator.service';
import { D3ChoroplethDataService } from 'src/app/services/d3-choropleth-data.service';
import { QualitativeTimedStatusAggregation } from 'src/app/services/types/qualitateive-timed-status-aggregation';
import { UrlHandlerService } from 'src/app/services/url-handler.service';
import { D3ChoroplethMapData } from '../d3-choropleth-map/d3-choropleth-map.component';

@Component({
  selector: 'app-overview-bed',
  templateUrl: './overview-bed.component.html',
  styleUrls: ['./overview-bed.component.less']
})
export class OverviewBedComponent implements OnInit {

  dataBlobBeds: Array<{
    data: Observable<D3ChoroplethMapData>,

    mo: MapOptions,

    mls: MapLocationSettings,

    aggLevelFriendly: string,

    bedTypeFriendly: string
  }> = [];


  gridNumCols = 3;


  bedTypes: string[];

  aggregatedDiviStatistics: QualitativeTimedStatusAggregation;

  constructor(
    private breakPointObserver: BreakpointObserver,
    private d3ChoroplethService: D3ChoroplethDataService,
    private configService: ConfigService,
    public urlHandler: UrlHandlerService,
    private countryAggregatorService: CountryAggregatorService
  ) { }

  ngOnInit(): void {
    this.breakPointObserver.observe(['(max-width: 500px)'])
      .subscribe(matched => {
        this.gridNumCols = matched.matches ? 1 : 3;
      });

      this.countryAggregatorService.diviAggregationForCountry()
      .subscribe(r => {
        this.aggregatedDiviStatistics = r;
      });


    const aggLevels = Object.values(AggregationLevel).filter(d => d !== AggregationLevel.none);

    this.bedTypes = Object.values(BedType);

    const mls = this.configService.overrideMapLocationSettings({
      zoom: 6,

      center: {
        lat: 51.1069818075,
        lng: 10.385780508
      }
    });

    for(const bedType of this.bedTypes) {
      for(const aggLevel of aggLevels) {

        const mo = this.configService.overrideMapOptions({ 
          bedGlyphOptions: {
            enabled: false,
            aggregationLevel: aggLevel
          },
          bedBackgroundOptions: { 
            enabled: true,
            aggregationLevel: aggLevel,
            bedType: bedType as BedType
          },
          covidNumberCaseOptions: {
            enabled: false
          }
        });

        this.dataBlobBeds.push(
          {
            data: this.d3ChoroplethService.get(mo, mls),

            mo: mo,

            mls: mls,

            aggLevelFriendly: aggLevel,

            bedTypeFriendly: bedType
          }          
        )
      }
    }
  }

}

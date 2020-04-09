import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { BedType } from 'src/app/map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { MapLocationSettings } from 'src/app/map/options/map-location-settings';
import { MapOptions } from 'src/app/map/options/map-options';
import { ConfigService } from 'src/app/services/config.service';
import { D3ChoroplethDataService } from 'src/app/services/d3-choropleth-data.service';
import { UrlHandlerService } from 'src/app/services/url-handler.service';
import { D3ChoroplethMapData } from '../d3-choropleth-map/d3-choropleth-map.component';

@Component({
  selector: 'app-overview-case',
  templateUrl: './overview-case.component.html',
  styleUrls: ['./overview-case.component.less']
})
export class OverviewCaseComponent implements OnInit {

  dataBlobCases: Array<{
    data: Observable<D3ChoroplethMapData>,

    mo: MapOptions,

    mls: MapLocationSettings,

    aggLevelFriendly: string,

    confDescription: string
  }> = [];


  gridNumCols = 3;


  bedTypes: string[];

  constructor(
    private breakPointObserver: BreakpointObserver,
    private d3ChoroplethService: D3ChoroplethDataService,
    private configService: ConfigService,
    public urlHandler: UrlHandlerService
  ) { }

  ngOnInit(): void {
    this.breakPointObserver.observe(['(max-width: 500px)'])
      .subscribe(matched => {
        this.gridNumCols = matched.matches ? 1 : 3;
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

    
    

    const defaultCaseConf = this.configService.overrideMapOptions({
      bedBackgroundOptions: {
        enabled: false
      },
      bedGlyphOptions: {
        enabled: false
      },
      covidNumberCaseOptions: {
        enabled: true
      }
    });

    // case map configs
    const caseConfigs = [

      {
        conf: this.configService.overrideMapOptions(defaultCaseConf, {
          covidNumberCaseOptions: {
            change: CovidNumberCaseChange.absolute,
            type: CovidNumberCaseType.cases,
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: CovidNumberCaseTimeWindow.all
          }
        }),

        desc: 'Covid 19 Erkrankungen gesamt'
      },

      {
        conf: this.configService.overrideMapOptions(defaultCaseConf, {
          covidNumberCaseOptions: {
            change: CovidNumberCaseChange.absolute,
            type: CovidNumberCaseType.deaths,
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: CovidNumberCaseTimeWindow.all
          }
        }),

        desc: 'Covid 19 Todesfälle gesamt'
      },

      {
        conf: this.configService.overrideMapOptions(defaultCaseConf, {
          covidNumberCaseOptions: {
            change: CovidNumberCaseChange.absolute,
            type: CovidNumberCaseType.cases,
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: CovidNumberCaseTimeWindow.twentyFourhours
          }
        }),

        desc: 'Covid 19 Erkrankungen letzte 24h'
      },

      {
        conf: this.configService.overrideMapOptions(defaultCaseConf, {
          covidNumberCaseOptions: {
            change: CovidNumberCaseChange.absolute,
            type: CovidNumberCaseType.deaths,
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: CovidNumberCaseTimeWindow.twentyFourhours
          }
        }),

        desc: 'Covid 19 Todesfälle letzte 24h'
      },
      
    ];


    for(const caseConfig of caseConfigs) {
      for(const aggLevel of aggLevels) {

        const conf = this.configService.overrideMapOptions(caseConfig.conf, {
          covidNumberCaseOptions: {
            aggregationLevel: aggLevel
          }
        });

        this.dataBlobCases.push({
          mo: conf,

          mls: mls,

          data: this.d3ChoroplethService.get(conf, mls),

          aggLevelFriendly: aggLevel,

          confDescription: caseConfig.desc
        });

      }
    }
  }

}

import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { AggregationLevel } from 'src/app/map/options/aggregation-level.enum';
import { BedType } from 'src/app/map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { ConfigService } from 'src/app/services/config.service';
import { CountryAggregatorService } from 'src/app/services/country-aggregator.service';
import { D3ChoroplethDataService } from 'src/app/services/d3-choropleth-data.service';
import { UrlHandlerService } from 'src/app/services/url-handler.service';
import { OverviewDataBlob } from '../overview-bed/overview-bed.component';

interface CovidDataBlob extends OverviewDataBlob {
  aggLevelFriendly: string;

  confDescription: string;
}

@Component({
  selector: 'app-overview-case',
  templateUrl: './overview-case.component.html',
  styleUrls: ['./overview-case.component.less']
})
export class OverviewCaseComponent implements OnInit {

  dataBlobCases: CovidDataBlob[] = [];


  gridNumCols = 3;


  bedTypes: string[];

  aggregatedRkiStatistics: RKICaseTimedStatus;

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

    this.countryAggregatorService.rkiAggregationForCountry('now')
      .subscribe(r => {
        this.aggregatedRkiStatistics = r;
      })


    this.initDataBlobs()
    .then(blobs => this.dataBlobCases = blobs);
  }

  private async initDataBlobs(): Promise<CovidDataBlob[]> {
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

        desc: 'Erkrankungen gesamt'
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

        desc: 'Todesfälle gesamt'
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

        desc: 'Erkrankungen letzte 24h'
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

        desc: 'Todesfälle letzte 24h'
      },
      
    ];

    const blobs: CovidDataBlob[] = [];

    for(const caseConfig of caseConfigs) {
      for(const aggLevel of aggLevels) {

        const conf = this.configService.overrideMapOptions(caseConfig.conf, {
          covidNumberCaseOptions: {
            aggregationLevel: aggLevel
          }
        });

        blobs.push({
          mo: conf,

          mls: mls,

          moUrl: await this.urlHandler.convertMLOToUrl(conf),

          mlsUrl: await this.urlHandler.convertMLSToUrl(mls),

          data: this.d3ChoroplethService.get(conf, mls),

          aggLevelFriendly: aggLevel,

          confDescription: caseConfig.desc
        });

      }
    }

    return blobs;
  }

}

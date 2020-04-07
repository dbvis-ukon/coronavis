import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { D3ChoroplethMapData } from '../d3-choropleth-map/d3-choropleth-map.component';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { ConfigService } from '../services/config.service';
import { D3ChoroplethDataService } from '../services/d3-choropleth-data.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.less']
})
export class OverviewComponent implements OnInit {

  dataBlob: Array<{
    data: Observable<D3ChoroplethMapData>,

    mo: MapOptions,

    mls: MapLocationSettings,

    aggLevelFriendly: string,

    bedTypeFriendly: string
  }> = [];


  gridNumCols = 3;


  constructor(
    private breakPointObserver: BreakpointObserver,
    private d3ChoroplethService: D3ChoroplethDataService,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    this.breakPointObserver.observe(['(max-width: 500px)'])
      .subscribe(matched => {
        this.gridNumCols = matched.matches ? 1 : 3;
      });


    const aggLevels = Object.values(AggregationLevel).filter(d => d !== AggregationLevel.none);

    const bedTypes = Object.values(BedType);

    for(const bedType of bedTypes) {
      for(const aggLevel of aggLevels) {

        const mo = this.configService.overrideMapOptions({ 
          bedGlyphOptions: {
            enabled: false
          },
          bedBackgroundOptions: { 
            enabled: true,
            aggregationLevel: aggLevel,
            bedType: bedType
          },
          covidNumberCaseOptions: {
            enabled: false
          }
        });

        const mls = this.configService.getDefaultMapLocationSettings();

        this.dataBlob.push(
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

import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG_URL_KEY, MAP_LOCATION_SETTINGS_URL_KEY } from 'src/constants';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';

@Injectable({
  providedIn: 'root'
})
export class UrlHandlerService {

  constructor(
    private router: Router,
    private location: Location
  ) { }

  public getUrl(mo: MapOptions, mls: MapLocationSettings): string {
    return `${window.location.href}`
    + `map;`
    + `${APP_CONFIG_URL_KEY}=${this.convertMLOToUrl(mo)};`
    + `${MAP_LOCATION_SETTINGS_URL_KEY}=${this.convertMLSToUrl(mls)}`;
  }


  public convertMLOToUrl(mlo: MapOptions): string {
    return this.objToUrl(mlo);
  }

  public convertUrlToMLO(urlParam: string): MapOptions {
    return this.urlToObj(urlParam) as MapOptions;
  }

  public convertMLSToUrl(mls: MapLocationSettings) : string {
    return this.objToUrl(mls);
  }

  public convertUrlToMLS(urlParam: string): MapLocationSettings {
    return this.urlToObj(urlParam) as MapLocationSettings;
  }

  private objToUrl(obj: object): string {
    return encodeURI(JSON.stringify(obj));
  }

  private urlToObj(url: string): object {
    return JSON.parse(decodeURI(url));
  }
}

import { Injectable } from '@angular/core';
import { MapOptions } from '../map/options/map-options';
import { MapLocationSettings } from '../map/options/map-location-settings';

@Injectable({
  providedIn: 'root'
})
export class UrlHandlerService {

  constructor() { }


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
    return btoa(JSON.stringify(obj));
  }

  private urlToObj(url: string): object {
    return JSON.parse(atob(url));
  }
}

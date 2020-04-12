import { Injectable } from '@angular/core';
import { default as createCodec } from 'json-url';
import { APP_CONFIG_URL_KEY, MAP_LOCATION_SETTINGS_URL_KEY } from 'src/constants';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';

@Injectable({
  providedIn: 'root'
})
export class UrlHandlerService {

  private codec;

  constructor(
  ) {
    this.codec = createCodec('lzstring');
  }

  private async compress(input): Promise<string> {
    return await this.codec.compress(JSON.stringify(input));
  }

  private async decompress(input): Promise<object> {
    const decoded = await this.codec.decompress(input);
    console.log('decompressed', JSON.parse(decoded));
    return JSON.parse(decoded);
    // return decode(lzwcomporess.unpack(atob(input)));
  }

  public async getUrl(mo: MapOptions, mls: MapLocationSettings): Promise<string> {
    return `${window.location.href}`
    + `map;`
    + `${APP_CONFIG_URL_KEY}=${await this.convertMLOToUrl(mo)};`
    + `${MAP_LOCATION_SETTINGS_URL_KEY}=${await this.convertMLSToUrl(mls)}`;
  }


  public async convertMLOToUrl(mlo: MapOptions): Promise<string> {
    return await this.objToUrl(mlo);
  }

  public async convertUrlToMLO(urlParam: string): Promise<MapOptions> {
    return await this.urlToObj(urlParam) as MapOptions;
  }

  public async convertMLSToUrl(mls: MapLocationSettings) : Promise<string> {
    return await this.objToUrl(mls);
  }

  public async convertUrlToMLS(urlParam: string): Promise<MapLocationSettings> {
    return await this.urlToObj(urlParam) as MapLocationSettings;
  }

  private async objToUrl(obj: object): Promise<string> {
    return await this.compress(obj);
  }

  private async urlToObj(url: string): Promise<unknown> {
    return await this.decompress(url);
  }
}

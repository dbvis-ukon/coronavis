import { Injectable } from '@angular/core';
import { schemeBlues, schemeGreens } from 'd3';
import { extent, max } from 'd3-array';
import { scaleLinear, ScaleLinear, scalePow, ScalePower, scaleQuantize, scaleThreshold } from 'd3-scale';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { CovidNumberCaseChange, CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from './case-util.service';

export interface ColorMapBin {
  color: string;

  min: number;

  max: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaseChoroplethColormapService {

  private unavailableColor = '#70929c';

  private caseChoroplethColorMap = scaleQuantize<string>()
    .domain([-1, 1])
    .range([...schemeGreens[8].slice(0, 7).reverse(), '#fff', ...schemeBlues[8].slice(0, 7)]);

  private lockDownColorMap = scaleThreshold<number, string>()
    .domain([
      0, // - 0
      0.000000000000000001, // - 1
      25 / 100000, // - 2
      50 / 100000, // - 3
      75 / 100000, // - 4
      100 / 100000, // - 5
      150 / 100000, // - 6
      200 / 100000, // - 7
      250 / 100000, // - 8
      300 / 100000, // - 9
      400 / 100000, // - 10
      500 / 100000, // - 11
      750 / 100000, // - 12
      1000 / 100000, // - 13
      1500 / 100000, // - 14
      2000 / 100000, // - 15
      2500 / 100000, // - 16
      3000 / 100000 // - 17
    ])
    .range([
      '#ffffff', // < 0 mostly unused - 0
      '#fefefe', // < ~0 - 1
      '#ccccff', // >= 25 - 2
      '#9999ff', // >= 50 - 3
      '#6666ff', // >= 75 - 4
      '#ffebcc', // >= 100 - 5
      '#ffc266', // >= 150 - 6
      '#ff9900', // >= 200 - 7
      '#ff9999', // >= 250 - 8
      '#ff3333', // >= 300 - 9
      '#cc0000', // >= 400 - 10
      '#e6b3e6', // >= 500 - 11
      '#cc66cc', // >= 750 - 12
      '#993399', // >= 1000 - 13
      '#808080', // >= 1500 - 14
      '#666666', // >= 2000 - 15
      '#333333', // >= 2500 - 16
      '#000000', // >= 3000 - 17
      '#000001', // unused
    ]);


    // private lockDownColorMap = scaleThreshold<number, string>()
    // .domain([
    //   0, // #2C83B9
    //   0.000000000000000001, // #25BA94
    //   5 / 100000, // #7CD58B
    //   15 / 100000, // #FFFFAE
    //   25 / 100000, // #FECA81
    //   35 / 100000, // #F1894A
    //   50 / 100000, // #EB1B1D
    //   100 / 100000, // #AF111B
    //   200 / 100000, // #B275DD
    //   350 / 100000, // #5B189B
    //   500 / 100000, // #5e5e5e
    //   1000 / 100000, // #535353
    //   1500 / 100000, // #393939
    //   2000 / 100000, // #1f1f1f
    //   2500 / 100000, // #000000
    //   // 1250 / 100000,
    //   // 1500 / 100000,
    //   // 1750 / 100000,
    //   // 2000 / 100000,
    //   // 2500 / 100000 // unused
    // ])
    // .range([
    //   '#2C83B9', // < 0 mostly unused
    //   '#25BA94', // < ~0
    //   '#7CD58B', // >= 5
    //   '#FFFFAE', // >= 15
    //   '#FECA81', // >= 25
    //   '#F1894A', // >= 35
    //   '#EB1B1D', // >= 50
    //   '#AF111B', // >= 100
    //   '#B275DD', // >= 200
    //   '#5B189B', // >= 350
    //   '#5e5e5e', // >= 500
    //   '#535353', // >= 1000
    //   '#393939', // >= 1500
    //   '#1f1f1f', // >= 2000
    //   '#131313', // >= 2500
    //   '#000000', // >= 3000
    // ]);

    /*
    [
"#ffffff","#ffffff","#fefefe","#fefefe","#fdfdfd","#fdfdfd","#fcfcfc","#fcfcfc","#fbfbfb","#fbfbfb",
"#fafafa","#fafafa","#f9f9f9","#f9f9f9","#f8f8f8","#f8f8f8","#f7f7f7","#f7f7f7","#f6f6f6","#f6f6f6",
"#f5f5f5","#f5f5f5","#f4f4f4","#f4f4f4","#f3f3f3","#f3f3f3","#f2f2f2","#f1f1f1","#f1f1f1","#f0f0f0",
"#f0f0f0","#efefef","#efefef","#eeeeee","#ededed","#ededed","#ececec","#ececec","#ebebeb","#eaeaea",
"#eaeaea","#e9e9e9","#e8e8e8","#e8e8e8","#e7e7e7","#e6e6e6","#e6e6e6","#e5e5e5","#e4e4e4","#e3e3e3",
"#e3e3e3","#e2e2e2","#e1e1e1","#e0e0e0","#e0e0e0","#dfdfdf","#dedede","#dddddd","#dddddd","#dcdcdc",
"#dbdbdb","#dadada","#dadada","#d9d9d9","#d8d8d8","#d7d7d7","#d6d6d6","#d6d6d6","#d5d5d5","#d4d4d4",
"#d3d3d3","#d2d2d2","#d1d1d1","#d1d1d1","#d0d0d0","#cfcfcf","#cecece","#cdcdcd","#cccccc","#cbcbcb",
"#cacaca","#c9c9c9","#c9c9c9","#c8c8c8","#c7c7c7","#c6c6c6","#c5c5c5","#c4c4c4","#c3c3c3","#c2c2c2",
"#c1c1c1","#c0c0c0","#bfbfbf","#bebebe","#bdbdbd","#bcbcbc","#bbbbbb","#bababa","#b9b9b9","#b8b8b8",
"#b6b6b6","#b5b5b5","#b4b4b4","#b3b3b3","#b2b2b2","#b1b1b1","#b0b0b0","#afafaf","#adadad","#acacac",
"#ababab","#aaaaaa","#a9a9a9","#a8a8a8","#a7a7a7","#a5a5a5","#a4a4a4","#a3a3a3","#a2a2a2","#a1a1a1",
"#9f9f9f","#9e9e9e","#9d9d9d","#9c9c9c","#9b9b9b","#9a9a9a","#989898","#979797","#969696","#959595",
"#949494","#939393","#919191","#909090","#8f8f8f","#8e8e8e","#8d8d8d","#8c8c8c","#8b8b8b","#8a8a8a",
"#888888","#878787","#868686","#858585","#848484","#838383","#828282","#818181","#808080","#7f7f7f",
"#7d7d7d","#7c7c7c","#7b7b7b","#7a7a7a","#797979","#787878","#777777","#767676","#757575","#747474",
"#737373","#727272","#717171","#6f6f6f","#6e6e6e","#6d6d6d","#6c6c6c","#6b6b6b","#6a6a6a","#696969",
"#686868","#676767","#666666","#656565","#646464","#636363","#626262","#606060","#5f5f5f","#5e5e5e", //1
"#5d5d5d","#5c5c5c","#5b5b5b","#5a5a5a","#595959","#575757","#565656","#555555","#545454","#535353",
"#525252","#505050","#4f4f4f","#4e4e4e","#4d4d4d","#4b4b4b","#4a4a4a","#494949","#484848","#464646",
"#454545","#444444","#424242","#414141","#404040","#3e3e3e","#3d3d3d","#3c3c3c","#3a3a3a","#393939",
"#383838","#363636","#353535","#343434","#323232","#313131","#303030","#2e2e2e","#2d2d2d","#2c2c2c",
"#2a2a2a","#292929","#282828","#262626","#252525","#242424","#232323","#212121","#202020","#1f1f1f",
"#1e1e1e","#1c1c1c","#1b1b1b","#1a1a1a","#191919","#181818","#161616","#151515","#141414","#131313",
"#121212","#101010","#0f0f0f","#0e0e0e","#0d0d0d","#0c0c0c","#0a0a0a","#090909","#080808","#070707",
"#060606","#050505","#030303","#020202","#010101","#000000"
]
    */

  constructor(private caseUtil: CaseUtilService) { }

  private getColorMap(options: CovidNumberCaseOptions) {
    return this.caseUtil.isLockdownMode(options) ? this.lockDownColorMap : this.caseChoroplethColorMap;
  }

  getUnavailableColor(): string {
    return this.unavailableColor;
  }

  getColorMapBins(
    options: CovidNumberCaseOptions,
    scaleFn?: ScaleLinear<number, number> | ScalePower<number, number>,
    onlyFullNumbers: boolean = false,
    dataExtent: [number, number] = null
  ): ColorMapBin[] {
    return this.getColorMap(options).range()
    .map(color => {
      const ext = this.getColorMap(options).invertExtent(color);

      const min = scaleFn ? scaleFn.invert(ext[0]) : ext[0];
      const max1 = scaleFn ? scaleFn.invert(ext[1]) : ext[1];

      return {
        color,
        min,
        max: max1
      } as ColorMapBin;
    })
    // filter out all bins not in the extent
    .filter(b => {
      if (!dataExtent) {
        return true;
      }

      return b.max >= dataExtent[0] && b.min <= dataExtent[1];
    })
    // clamp the bins to the actual numbers
    .map((b, i, arr) => {
      if (!dataExtent) {
        return b;
      }

      if (i === 0) {
        return {
          color: b.color,

          min: dataExtent[0],

          max: b.max
        } as ColorMapBin;
      }

      if (i === (arr.length - 1)) {
        return {
          color: b.color,

          min: b.min,

          max: dataExtent[1]
        } as ColorMapBin;
      }

      return b;
    })
    // filter out bins that do not capture a full number
    .filter(b => {
      if (!onlyFullNumbers) {
        return true;
      }

      const minFull = Math.ceil(b.min);
      const maxFull = Math.floor(b.max);

      return (minFull >= b.min && minFull <= b.max) || (maxFull <= b.max && maxFull >= b.min);
    })
    // round bin limits to full numbers
    .map((b, i, arr) => {
      if (!onlyFullNumbers) {
        return b;
      }

      const max1 = i > 0 && i < arr.length - 1 ? Math.round(b.max) - 1 : Math.round(b.max);

      return {
        color: b.color,
        min: Math.round(b.min),
        max: max1
      } as ColorMapBin;
    })
    // filter out double bins
    .filter((b, i, arr) => {
      if (i === 0) {
        return true;
      }

      const last = arr[i - 1];

      if (onlyFullNumbers && last.max === b.min) {
        return false;
      }

      return true;
    });
  }


  getColor(
    scaleFn: ScalePower<number, number> | ScaleLinear<number, number>,
    dataPoint: Feature<Geometry, RKICaseDevelopmentProperties>,
    options: CovidNumberCaseOptions
  ): string {


    if (!this.caseUtil.isInFilter(dataPoint, options)) {
      return this.unavailableColor;
    }

    const nmbr = this.getCaseNumbers(dataPoint.properties, options);
    return this.getColorMap(options)(scaleFn(nmbr));
  }

  public getDomainExtent(
    fc: FeatureCollection<Geometry, RKICaseDevelopmentProperties>,
    options: CovidNumberCaseOptions,
    actualExtent: boolean = false
  ): [number, number] {
    const cases: number[] = this.caseUtil.getCaseNumbersArray(fc, options);

    if (options.change === CovidNumberCaseChange.absolute) {
      if (actualExtent) {
        return extent<number>(cases);
      }

      if (this.caseUtil.isLockdownMode(options)) {
        return extent(this.lockDownColorMap.domain());
      }

      return [0, max<number>(cases)];
    } else {
      const [minChange, maxChange] = extent(cases.filter(d => d < Infinity));
      if (actualExtent) {
        return [minChange, maxChange];
      }
      const max1 = Math.max(Math.abs(minChange), Math.abs(maxChange));

      return [-max, max1];
    }
  }

  private getRangeExtent(options: CovidNumberCaseOptions): [number, number] {
    if (this.caseUtil.isLockdownMode(options)) {
      return extent(this.lockDownColorMap.domain());
    }
    return options.change === CovidNumberCaseChange.absolute ? [0, 1] : [-1, 1];
  }

  public getScale(fc: FeatureCollection<Geometry, RKICaseDevelopmentProperties>, options: CovidNumberCaseOptions): ScalePower<number, number> | ScaleLinear<number, number> {
    if (options.change === CovidNumberCaseChange.absolute) {

      if (this.caseUtil.isLockdownMode(options)) {
        return scaleLinear()
          .domain(this.getDomainExtent(fc, options))
          .range(this.getRangeExtent(options))
          .clamp(true);
      }

      return scalePow().exponent(0.33)
        .domain(this.getDomainExtent(fc, options))
        .range(this.getRangeExtent(options));



    } else {

      return scaleLinear()
        .domain(this.getDomainExtent(fc, options))
        .range(this.getRangeExtent(options))
        .clamp(true);
    }
  }


  public getCaseNumbers(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions) {
    return this.caseUtil.getCaseNumbers(data, options);
  }



}

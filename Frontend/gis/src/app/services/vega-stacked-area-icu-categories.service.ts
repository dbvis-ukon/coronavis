/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { BedType } from '../map/options/bed-type.enum';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { Region } from '../repositories/types/in/region';
import { getMoment, getStrDate } from '../util/date-util';
import { CaseUtilService } from './case-util.service';
import { StackedAreaIcuItem } from './chart.service';
import { ExportCsvService } from './export-csv.service';
import { TranslationService } from './translation.service';

export interface IcuCategoriesDataPoint {
  date: string;
  icuCategory: string;
  availability: string;
  numberOfHospitals: number;
}

export interface IcuCategoriesDataAndOptions {
  config: CovidChartOptions;
  data: IcuCategoriesDataPoint[];
  chartOptions: {
    titleRegions: string;
    width: number | 'container';
    height: number;
    scaleType: string;
    timeAgg: string;
    xDomain?: [string, string];
    yDomain?: [number, number];
  };
}

@Injectable({
  providedIn: 'root'
})
export class VegaStackedAreaIcuCategoriesService {

  template = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": {
      "values": [
      ]
    },
    "transform": [
      {"filter": {"field": "date", "timeUnit": "yearmonthdate", "range": []}},
      {"filter": {"field": "numberOfHospitals", "range": []}}
    ],
    "vconcat": [
      {
        "width": 1218,
        "height": 50,
        "layer": [
          {
            "mark": {"type": "area", "interpolate": "step-after", "tooltip": true},
            "encoding": {
              "x": {
                "field": "date",
                "type": "temporal",
                "title": "",
                "scale": {"domain": ["2020-01-23", "2021-04-03"]}
              },
              "y": {
                "field": "numberOfHospitals",
                "type": "quantitative",
                "axis": {"tickMinStep": 1, "minExtent": 40, "maxExtent": 40, "orient": "left"},
                "scale": {"domain": [0, 38], "type": "linear"},
                "title": ["ICU Low", "# Hospitals"]
              },
              "color": {
                "type": "nominal",
                "field": "availability",
                "title": "Kategorie",
                "scale": {
                  "domain": [
                    "Verfügbar",
                    "Begrenzt",
                    "Ausgelastet",
                    "Nicht verfügbar",
                    "Keine Information"
                  ],
                  "range": [
                    "rgb(113,167,133)",
                    "rgb(230,181,72)",
                    "rgb(198,106,75)",
                    "#c2cbd4",
                    "#bbb"
                  ]
                },
                "legend": {"orient": "bottom"}
              }
            },
            "params": [
              {
                "name": "hover",
                "select": {"type": "point", "fields": ["availability"]},
                "bind": {"legend": "mouseover"}
              }
            ],
            "transform": [
              {"filter": "datum.icuCategory == 'icu_low'"},
              {"filter": {"param": "hover", "empty": true}}
            ]
          },
          {
            "transform": [
              {"filter": "datum.icuCategory == 'icu_low'"},
              {"pivot": "availability", "value": "numberOfHospitals", "groupby": ["date"]}
            ],
            "mark": "rule",
            "encoding": {
              "x": {
                "field": "date",
                "type": "temporal"
              },
              "opacity": {
                "condition": {"value": 0.3, "param": "hover2", "empty": false},
                "value": 0
              },
              "tooltip": [
                {"field": "date", "type": "temporal", "title": "Date"},
                {"field": "Verfügbar", "type": "quantitative"},
                {"field": "Begrenzt", "type": "quantitative"},
                {"field": "Ausgelastet", "type": "quantitative"},
                {"field": "Nicht verfügbar", "type": "quantitative"},
                {"field": "Keine Information", "type": "quantitative"}
              ]
            },
            "params": [
              {
                "name": "hover2",
                "select": {
                  "type": "point",
                  "fields": ["date"],
                  "nearest": true,
                  "on": "mouseover",
                  "clear": "mouseout"
                }
              }
            ]
          },
          {
            "mark": "point",
            "encoding": {
              "y": {
                "field": "numberOfHospitals",
                "type": "quantitative",
                "axis": {"tickMinStep": 1, "minExtent": 40, "maxExtent": 40, "orient": "right"},
                "scale": {"domain": [0, 6], "type": "linear"},
                "title": ["ICU Low", "# Hospitals"]
              },
              "opacity": {
                "value": 0
              }
            }
          }
        ]
      },
      {
        "width": 1218,
        "height": 50,
        "layer": [
          {
            "mark": {"type": "area", "interpolate": "step-after", "tooltip": true},
            "encoding": {
              "x": {
                "field": "date",
                "type": "temporal",
                "title": "",
                "scale": {"domain": ["2020-01-23", "2021-04-03"]}
              },
              "y": {
                "field": "numberOfHospitals",
                "type": "quantitative",
                "axis": {"tickMinStep": 1, "minExtent": 40, "maxExtent": 40, "orient": "left"},
                "scale": {"domain": [0, 38], "type": "linear"},
                "title": ["ICU High", "# Hospitals"]
              },
              "color": {
                "type": "nominal",
                "field": "availability",
                "title": "Kategorie",
                "scale": {
                  "domain": [
                    "Verfügbar",
                    "Begrenzt",
                    "Ausgelastet",
                    "Nicht verfügbar",
                    "Keine Information"
                  ],
                  "range": [
                    "rgb(113,167,133)",
                    "rgb(230,181,72)",
                    "rgb(198,106,75)",
                    "#c2cbd4",
                    "#bbb"
                  ]
                },
                "legend": {"orient": "bottom"}
              }
            },
            "params": [
              {
                "name": "hover",
                "select": {"type": "point", "fields": ["availability"]},
                "bind": {"legend": "mouseover"}
              }
            ],
            "transform": [
              {"filter": "datum.icuCategory == 'icu_high'"},
              {"filter": {"param": "hover", "empty": true}}
            ]
          },
          {
            "transform": [
              {"filter": "datum.icuCategory == 'icu_high'"},
              {"pivot": "availability", "value": "numberOfHospitals", "groupby": ["date"]}
            ],
            "mark": "rule",
            "encoding": {
              "x": {
                "field": "date",
                "type": "temporal"
              },
              "opacity": {
                "condition": {"value": 0.3, "param": "hover2", "empty": false},
                "value": 0
              },
              "tooltip": [
                {"field": "date", "type": "temporal", "title": "Date"},
                {"field": "Verfügbar", "type": "quantitative"},
                {"field": "Begrenzt", "type": "quantitative"},
                {"field": "Ausgelastet", "type": "quantitative"},
                {"field": "Nicht verfügbar", "type": "quantitative"},
                {"field": "Keine Information", "type": "quantitative"}
              ]
            },
            "params": [
              {
                "name": "hover2",
                "select": {
                  "type": "point",
                  "fields": ["date"],
                  "nearest": true,
                  "on": "mouseover",
                  "clear": "mouseout"
                }
              }
            ]
          },
          {
            "mark": "point",
            "encoding": {
              "y": {
                "field": "numberOfHospitals",
                "type": "quantitative",
                "axis": {"tickMinStep": 1, "minExtent": 40, "maxExtent": 40, "orient": "right"},
                "scale": {"domain": [0, 6], "type": "linear"},
                "title": ["ICU High", "# Hospitals"]
              },
              "opacity": {
                "value": 0
              }
            }
          }
        ]
      },
      {
        "width": 1218,
        "height": 50,
        "layer": [
          {
            "mark": {"type": "area", "interpolate": "step-after", "tooltip": true},
            "encoding": {
              "x": {
                "field": "date",
                "type": "temporal",
                "title": "",
                "scale": {"domain": ["2020-01-23", "2021-04-03"]}
              },
              "y": {
                "field": "numberOfHospitals",
                "type": "quantitative",
                "axis": {"tickMinStep": 1, "minExtent": 40, "maxExtent": 40, "orient": "left"},
                "scale": {"domain": [0, 38], "type": "linear"},
                "title": ["ECMO", "# Hospitals"]
              },
              "color": {
                "type": "nominal",
                "field": "availability",
                "title": "Kategorie",
                "scale": {
                  "domain": [
                    "Verfügbar",
                    "Begrenzt",
                    "Ausgelastet",
                    "Nicht verfügbar",
                    "Keine Information"
                  ],
                  "range": [
                    "rgb(113,167,133)",
                    "rgb(230,181,72)",
                    "rgb(198,106,75)",
                    "#c2cbd4",
                    "#bbb"
                  ]
                },
                "legend": {"orient": "bottom"}
              }
            },
            "params": [
              {
                "name": "hover",
                "select": {"type": "point", "fields": ["availability"]},
                "bind": {"legend": "mouseover"}
              }
            ],
            "transform": [
              {"filter": "datum.icuCategory == 'ecmo'"},
              {"filter": {"param": "hover", "empty": true}}
            ]
          },
          {
            "transform": [
              {"filter": "datum.icuCategory == 'ecmo'"},
              {"pivot": "availability", "value": "numberOfHospitals", "groupby": ["date"]}
            ],
            "mark": "rule",
            "encoding": {
              "x": {
                "field": "date",
                "type": "temporal"
              },
              "opacity": {
                "condition": {"value": 0.3, "param": "hover2", "empty": false},
                "value": 0
              },
              "tooltip": [
                {"field": "date", "type": "temporal", "title": "Date"},
                {"field": "Verfügbar", "type": "quantitative"},
                {"field": "Begrenzt", "type": "quantitative"},
                {"field": "Ausgelastet", "type": "quantitative"},
                {"field": "Nicht verfügbar", "type": "quantitative"},
                {"field": "Keine Information", "type": "quantitative"}
              ]
            },
            "params": [
              {
                "name": "hover2",
                "select": {
                  "type": "point",
                  "fields": ["date"],
                  "nearest": true,
                  "on": "mouseover",
                  "clear": "mouseout"
                }
              }
            ]
          },
          {
            "mark": "point",
            "encoding": {
              "y": {
                "field": "numberOfHospitals",
                "type": "quantitative",
                "axis": {"tickMinStep": 1, "minExtent": 40, "maxExtent": 40, "orient": "right"},
                "scale": {"domain": [0, 6], "type": "linear"},
                "title": ["ECMO", "# Hospitals"]
              },
              "opacity": {
                "value": 0
              }
            }
          }
        ]
      }
    ]
  };

  constructor(
    private caseUtil: CaseUtilService,
    private exportCsv: ExportCsvService,
    private hospitalRepo: QualitativeDiviDevelopmentRepository,
    private translationServive: TranslationService
  ) {}


  compileToDataAndOptions(o: CovidChartOptions, dataRequests: Region[]): Observable<IcuCategoriesDataAndOptions> {
    const xExtent: [string, string] = [null, null];
    const yExtent: [number, number] = [0, 0];

    let manXExtent: [string, string] = null;
    if (o.temporalExtent.type === 'manual') {
      if (o.temporalExtent.manualLastDays > 0) {
        manXExtent = [getStrDate(getMoment('now').subtract(o.temporalExtent.manualLastDays, 'days')), getStrDate(getMoment('now'))];
      } else {
        manXExtent = o.temporalExtent.manualExtent;
      }
    }

    return this.hospitalRepo.getDiviDevelopmentAggregated(dataRequests, true)
        .pipe(
          map(d => {
            const data = d.properties.developments
            .filter(d1 => {
              if (manXExtent !== null && !getMoment(d1.timestamp).isBetween(getMoment(manXExtent[0]), getMoment(manXExtent[1]), 'day', '[]')) {
                return false;
              }

              return true;
            })
            .map(d1 => {
              if (xExtent[0] === null || getMoment(xExtent[0]).isAfter(getMoment(d1.timestamp))) {
                xExtent[0] = d1.timestamp;
              }

              if (xExtent[1] === null || getMoment(xExtent[1]).isBefore(getMoment(d1.timestamp))) {
                xExtent[1] = d1.timestamp;
              }

              const ret: IcuCategoriesDataPoint[] = [];
              for (const bed of [BedType.icuLow, BedType.icuHigh, BedType.ecmo]) {
                const k = bed+'_state';
                let countSum = 0;
                // eslint-disable-next-line guard-for-in
                for (const avail in d1[k]) {
                  // if (!d1[bed].hasOwnProperties(avail)) {
                  //   continue;
                  // }
                  // avail == verfuegbar, ausgelastet
                  const count: number = d1[k][avail];
                  countSum += count;

                  ret.push({
                    date: d1.timestamp,
                    icuCategory: bed,
                    availability: this.translationServive.translate(avail),
                    numberOfHospitals: count
                  } as IcuCategoriesDataPoint);
                }

                if (yExtent[0] > countSum) {
                  yExtent[0] = countSum;
                }

                if (yExtent[1] < countSum) {
                  yExtent[1] = countSum;
                }
              }

              return ret;
            });

          return [].concat(...data);
        }),
        map(dps => ({
            config: o,
            data: dps,
            chartOptions: {
              titleRegions: dataRequests.map(r => (r.description + ' ' + r.name).trim()).join(', '),
              width: 'container',
              height: 50,
              timeAgg: o.timeAgg,
              scaleType: o.scaleType,
              xDomain: xExtent,
              yDomain: yExtent
            }
          } as IcuCategoriesDataAndOptions))
      );

  }


  compileChart(dataAndOptions: IcuCategoriesDataAndOptions): any {
    if (!dataAndOptions) {
      return null;
    }

    const categories = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar', 'Keine Information'];
    const catTranslated = categories.map(d => this.translationServive.translate(d));

    const data = dataAndOptions.data;
    const chartOptions = dataAndOptions.chartOptions;

    const spec = JSON.parse(JSON.stringify(this.template));

    // inject data values
    spec.data.values = data;

    for (let i = 0; i < 3; i++) {
      spec.vconcat[i].width = chartOptions.width;
      spec.vconcat[i].height = chartOptions.height;

      // spec.vconcat[i].encoding.x.timeUnit = chartOptions.timeAgg || 'yearmonthdate';

      if (chartOptions.xDomain) {
        spec.vconcat[i].layer[0].encoding.x.scale.domain = chartOptions.xDomain;
      }

      if (chartOptions.yDomain) {
        spec.vconcat[i].layer[0].encoding.y.scale.domain = chartOptions.yDomain;
        spec.vconcat[i].layer[2].encoding.y.scale.domain = chartOptions.yDomain;
      }

      spec.vconcat[i].layer[0].encoding.color.scale.domain = catTranslated;

      spec.vconcat[i].layer[0].encoding.y.scale.type = chartOptions.scaleType || 'linear';
      spec.vconcat[i].layer[2].encoding.y.scale.type = chartOptions.scaleType || 'linear';

      const tltp = [{"field": "date", "type": "temporal", "title": this.translationServive.translate('Datum')}];

      catTranslated.forEach(d => tltp.push({"field": d, "type": "quantitative", "title": d}));
      spec.vconcat[i].layer[1].encoding.tooltip = tltp;

    }

    if (chartOptions.yDomain) {
      spec.transform[1].filter.range = chartOptions.yDomain;
    }

    if (chartOptions.xDomain) {
      spec.transform[0].filter.range = chartOptions.xDomain;
    }

    return spec;
  }

  downloadCsv(item: StackedAreaIcuItem): void {
    const data = item._compiled.data;
    const fileName = 'number-of-hospitals-and-their-capacity-for-bed-categories';

    const m: Map<string, {[key: string]: string}> = new Map();

    const cols: Set<string> = new Set();

    data.forEach(d => {
      if (!m.has(d.date)) {
        m.set(d.date, {});
      }

      const col = d.icuCategory + ':' + d.availability;

      m.get(d.date)[col] = d.numberOfHospitals + '';

      cols.add(col);
    });

    const dateArr: string[] = [];

    for (const date of m.keys()) {
      dateArr.push(date);
    }

    dateArr.sort();


    const records = dateArr.map(d => {

      const record: Record<string, string> = {
        'Date': d,
        ...m.get(d)
      };

      return record;
    });

    const sortedCols = [...cols].sort();

    const colsArr: string[] = ['Date', ...sortedCols];

    this.exportCsv.exportToCsv(records, fileName, colsArr);
  }
}

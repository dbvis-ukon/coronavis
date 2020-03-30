import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import {
  ColormapService
} from '../services/colormap.service';
import {
  TimestampedValue
} from '../repositories/divi-development.respository';
import {
  DiviHospital,
  BedStatusSummary
} from '../services/glyph-layer.service';
import {
  getLatest
} from '../util/timestamped-value';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  contact: string;
  url: boolean;

  contactMsg: string;

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: DiviHospital;

  templateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 200,
    "height": 100,
    "data": {
        "values": [{
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/26/2020, 5:55:31 PM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 9:03:50 AM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 7:36:42 PM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 8:57:00 PM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 9:00:12 PM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 9:26:37 PM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 10:00:06 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/27/2020, 11:00:10 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 12:00:07 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 1:00:05 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 2:00:12 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 3:00:11 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 4:00:08 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 5:00:08 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 6:00:06 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 7:00:14 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 8:00:10 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 9:00:07 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 9:36:21 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 10:00:08 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 10:13:13 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 11:00:31 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 12:00:07 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 1:00:10 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 2:00:06 PM",
            "Vorhersage": false,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/28/2020, 2:00:06 PM",
            "Vorhersage": true,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_total",
            "Datum": "3/29/2020, 3:30:03 AM",
            "Vorhersage": true,
            "v": 10
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/26/2020, 5:55:31 PM",
            "Vorhersage": false,
            "v": 0
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 9:03:50 AM",
            "Vorhersage": false,
            "v": 0
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 7:36:42 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 8:57:00 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 9:00:12 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 9:26:37 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 10:00:06 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/27/2020, 11:00:10 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 12:00:07 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 1:00:05 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 2:00:12 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 3:00:11 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 4:00:08 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 5:00:08 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 6:00:06 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 7:00:14 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 8:00:10 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 9:00:07 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 9:36:21 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 10:00:08 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 10:13:13 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 11:00:31 AM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 12:00:07 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 1:00:10 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 2:00:06 PM",
            "Vorhersage": false,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/28/2020, 2:00:06 PM",
            "Vorhersage": true,
            "v": 8
        }, {
            "Kategorie": "ICU - Low Care_value",
            "Datum": "3/29/2020, 3:30:03 AM",
            "Vorhersage": true,
            "v": 8
        }]
    },
    "layer": [{ 
        "mark": {
          "type": "line",
          "interpolate": "monotone"
           
        },
        "encoding": { 
            "x": {
                "field": "Datum",
                "type": "temporal",
                "axis": {
                    "title": "Datum",
                    "tickCount": 5,
                    "tickMinStep": 2,
                    "grid" : false
                }
                
            },
            "y": {
                "field": "v",
                "type": "quantitative",
                "axis": {
                    "tickMinStep": 2,
                    "tickCount": 10,
                    "title": "Anzahl Betten",
                    "grid" : false
                },
                "scale": {
                  "domain" : [0,15]
                }
            },
            
            "strokeDash": {
                "field": "Vorhersage",
                "type": "nominal",
                "scale": {"domain": ["false", "true"]},
                "legend": {
                    "orient": "left",
                    "values": ["false","true"]
                }
            },
            "strokeWidth": {
              "value": 3
            },
            
            "color": {
                "field": "Kategorie",
                "type": "nominal",
                "legend": {
                    "orient": "left"
                },
                
                "scale": {"range": ["#4575b4", "#74add1"],
                "domain": ["ICU - Low Care_value","ICU - Low Care_total"]}
                
            },
            "opacity": {
                "value": 0.8
            }
        }
    }]
}

  // templateSpec = {
  //   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  //   "width": 180,
  //   "height": 100,
  //   "data": {
  //     "values": []
  //   },
  //   "layer": [{
  //       "mark": "line",
  //       "encoding": {
  //         "x": {
  //           "field": "Datum",
  //           "type": "nominal",
  //           "axis": {
  //             "title": "Datum",
  //             "scale": {
  //               "domain": {
  //                 "field": "Datum"
  //               }
  //             }
  //           }
  //         },
  //         "y": {
  //           "field": "Bettenauslastung (%)",
  //           "type": "quantitative",
  //           "axis": {
  //             "tickMinStep": 10,
  //             "tickCount": 10,
  //             "title": "Bettenauslastung (%)"
  //           },
  //           "scale": {
  //             "domain": [0, 120]
  //           }
  //         },
  //         "strokeDash": {
  //           "field": "Vorhersage",
  //           "type": "nominal",
  //           "legend": {
  //             "orient": "left"
  //           }
  //         },
  //         "color": {
  //           "field": "Kategorie",
  //           "type": "nominal",
  //           "legend": {
  //             "orient": "left"
  //           }
  //         },
  //         "opacity": {
  //           "value": 0.8
  //         }
  //       },
  //     },
  //     {
  //       "data": {
  //         "values": [{
  //           "predicitonStartDate": "2018-02-02"
  //         }]
  //       },
  //       "mark": "rule",
  //       "encoding": {
  //         "x": {
  //           "field": "predicitonStartDate",
  //           "type": "nominal",
  //           "axis": false
  //         },
  //         "strokeWidth": {
  //           "value": 0.1
  //         },
  //         "opacity": {
  //           "value": 0.4
  //         },
  //         "color": {
  //           "value": "grey"
  //         },
  //         "strokeDash": {
  //           "signal": [18, 4]
  //         }
  //       }
  //     },
  //     {
  //       "data": {
  //         "values": [{
  //           "ref": 100
  //         }]
  //       },
  //       "mark": "rule",
  //       "encoding": {
  //         "y": {
  //           "field": "ref"
  //         },
  //         "strokeWidth": {
  //           "value": 0.1
  //         },
  //         "opacity": {
  //           "value": 0.4
  //         },
  //         "axis": false,
  //         "color": {
  //           "value": "grey"
  //         },
  //         "strokeDash": {
  //           "signal": [18, 4]
  //         }
  //       }
  //     }
  //   ]
  // };

  specs = [];
  bedAccessors = ['icu_low_care', 'icu_high_care', 'icu_ecmo_care'];
  bedAccessorsMapping = {
    'icu_low_care': 'ICU - Low Care',
    'icu_high_care': 'ICU - High Care',
    'icu_ecmo_care': 'ECMO'
  };

  constructor(private colormapService: ColormapService) {}

  ngOnInit(): void {
    console.log('tooltip', this.data);

    if (this.data.Webaddress.indexOf('http') > -1) {
      this.contact = 'http' + this.data.Webaddress.split('http')[1];
      this.url = true;

      this.contactMsg = this.data.Webaddress.replace(this.contact, '').replace('Website', '').trim();

      if (this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    } else {
      this.contact = this.data.Webaddress;
      this.url = false;

      this.contactMsg = this.data.Webaddress;
    }

    this.specs = [];
    let dataValues = [];
    let predictionDay;


    let maxValue = 0;

    for (const bedAccessor of this.bedAccessors) {
      dataValues = [];
      const entryLength = this.data[bedAccessor + '_frei'].length;

      const freeBeds = this.data[bedAccessor + '_frei'];
      const occupiedBeds = this.data[bedAccessor + '_belegt'];

      const totalBeds = freeBeds[entryLength - 1].value + occupiedBeds[entryLength - 1].value;

      let i = 0;
      for (const free of freeBeds) {
        const occupied = occupiedBeds[i];
        const rate = (occupied.value / (free.value + occupied.value) * 100) || 0;
        dataValues.push({
          Kategorie: this.bedAccessorsMapping[bedAccessor],
          Datum: new Date(free.timestamp).toLocaleString(),
          'Bettenauslastung (%)': rate,
          Vorhersage: false,
          value: occupied.value,
          total: free.value + occupied.value
        });
        i++;
      }

      const prediction = this.data[bedAccessor + '_einschaetzung'][entryLength - 1];
      const predictedRate = ((occupiedBeds[entryLength - 1].value + prediction.value) / totalBeds * 100) || 0;
      predictionDay = prediction.timestamp;
      const nextDay = new Date();
      nextDay.setDate(new Date(predictionDay).getDate() + 1);



      const lastRealDataDay_freeBeds = getLatest(this.data[bedAccessor + '_frei']);
      const lastRealDataDay_occupiedBeds = getLatest(this.data[bedAccessor + '_belegt']);
      const lastRealDataDay_totalBeds = lastRealDataDay_freeBeds + lastRealDataDay_occupiedBeds;
      const lastRealDataDay_rate = (lastRealDataDay_occupiedBeds / lastRealDataDay_totalBeds * 100) || 0;
      dataValues.push({
        Kategorie: this.bedAccessorsMapping[bedAccessor],
        Datum: new Date(predictionDay).toLocaleString(),
        'Bettenauslastung (%)': lastRealDataDay_rate,
        Vorhersage: true
      });


      dataValues.push({
        Kategorie: this.bedAccessorsMapping[bedAccessor],
        Datum: nextDay.toLocaleString(),

        'Bettenauslastung (%)': predictedRate,
        Vorhersage: true
      });


      const totalValue = ['total', 'value'];
      const friendlyTotalValue = {
        'total': 'Gesamt',
        'value': 'Belegt'
      }

      const dataValues2 = [];
      for(const acc of totalValue) {
        dataValues.forEach(d => {
          if(d[acc] > maxValue) {
            maxValue = d[acc];
          }
          dataValues2.push({
            Kategorie: friendlyTotalValue[acc],
            Datum: d.Datum,
            Vorhersage: d.Vorhersage,
            v: d[acc]
          })
        })
      }

      // hack deep clone spec
      const spec = JSON.parse(JSON.stringify(this.templateSpec));

      // inject data values
      spec.data.values = dataValues2;
      spec.layer[0].encoding.color.scale.domain = [friendlyTotalValue['value'], friendlyTotalValue['total']];
      // spec.layer[0].encoding.color.legend.title = this.bedAccessorsMapping[bedAccessor];

      // spec.layer[1].data.values[0].predicitonStartDate = new Date(predictionDay).toLocaleString();

      this.specs.push(spec);
    }

    this.specs.forEach(s => {
      s.layer[0].encoding.y.scale.domain = [0, maxValue+1];
    });

    

    console.log('vega specs', this.specs, JSON.stringify(this.specs));
  }

  getCapacityStateColor(bedstatus: BedStatusSummary): string {
    return this.colormapService.getBedStatusColor(bedstatus)
  }

  getLatest(entries: TimestampedValue[]): number {
    return getLatest(entries);
  }

  getTrendIcon(entries: TimestampedValue[]): string {
    const latest = getLatest(entries);
    return latest >= 0 ? (latest == 0 ? 'trending_flat' : 'trending_up') : 'trending_down';
  }

}

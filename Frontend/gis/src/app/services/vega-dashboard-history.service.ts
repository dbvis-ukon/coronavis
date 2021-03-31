/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { Dashboard } from '../repositories/types/in/dashboard';

@Injectable({
  providedIn: 'root'
})
export class VegaDashboardHistoryService {


  template = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "An example of Cartesian layouts for a node-link diagram of hierarchical data.",
    "width": 600,
    "height": 200,
    "padding": 5,
    "data": [
      {
        "name": "tree",
        "transform": [
          {"type": "stratify", "key": "id", "parentKey": "parent_id"},
          {
            "type": "tree",
            "method": "tidy",
            "size": [{"signal": "height"}, {"signal": "width - 100"}],
            "separation": true,
            "as": ["y", "x", "depth", "children"]
          }
        ],
        "values": []
      },
      {
        "name": "links",
        "source": "tree",
        "transform": [
          {"type": "treelinks"},
          {
            "type": "linkpath",
            "orient": "horizontal",
            "shape": "diagonal"
          }
        ]
      }
    ],
    "scales": [
      {
        "name": "color",
        "type": "linear",
        "range": {"scheme": "magma"},
        "domain": {"data": "tree", "field": "depth"},
        "zero": true
      }
    ],
    "marks": [
      {
        "type": "path",
        "from": {"data": "links"},
        "encode": {
          "update": {"path": {"field": "path"}, "stroke": {"value": "#ccc"}}
        }
      },
      {
        "type": "symbol",
        "from": {"data": "tree"},
        "encode": {
          "enter": {"size": {"value": 100}, "stroke": {"value": "#fff"}},
          "update": {
            "x": {"field": "x"},
            "y": {"field": "y"},
            "fill": {"signal": "datum.current ? '#f00' : '#000'"},
            "cursor": {"value": "pointer"}
          }
        }
      },
      {
        "type": "text",
        "from": {"data": "tree"},
        "encode": {
          "enter": {
            "text": {"field": "title"},
            "fontSize": {"value": 9},
            "baseline": {"value": "middle"}
          },
          "update": {
            "x": {"field": "x"},
            "y": {"field": "y"},
            "dx": {"signal": "datum.children ? -7 : 7"},
            "align": {"signal": "datum.children ? 'right' : 'left'"},
            "opacity": {"signal": "1"},
            "cursor": {"value": "pointer"}
          }
        }
      }
    ]
  }
  ;

  constructor() {}

  compileChart(data: Dashboard[], width: number, height: number): any {
    if (!data) {
      return null;
    }

    const spec = JSON.parse(JSON.stringify(this.template));

    // inject data values
    spec.data[0].values = data;

    spec.width = width;
    spec.height = height;

    return spec;
  }
}

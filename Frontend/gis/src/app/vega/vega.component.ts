import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, TemplateRef } from '@angular/core';
import {default as embed} from 'vega-embed';
import { VisualizationSpec } from 'vega-embed';

@Component({
  selector: 'app-vega',
  template: `
  <div>
    <div #chart></div>
  </div>
  `,
  styleUrls: ['./vega.component.less']
})
export class VegaComponent implements AfterViewInit {

  @ViewChild('chart', {static: true})
  chartRef: ElementRef<HTMLDivElement>;

  private _spec: VisualizationSpec;

  @Input()
  set spec(sp: VisualizationSpec) {
    this._spec = sp;

    this.updateChart();
  }

  get spec(): VisualizationSpec {
    return this._spec;
  }


  constructor() { }


  ngAfterViewInit(): void {
    this.updateChart();
  }

  updateChart() {
    // empty content
    const node = this.chartRef.nativeElement;
    

    if(!node ) {
      return;
    }

    node.innerHTML = '';

    if(!this._spec) {
      return;
    }

    embed(node, this._spec, {actions: false});
  }

}

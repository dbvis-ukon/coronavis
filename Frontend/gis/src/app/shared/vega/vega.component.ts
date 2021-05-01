import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormatLocaleDefinition } from 'd3-format';
import { TimeLocaleDefinition } from 'd3-time-format';
import { default as embed, VisualizationSpec } from 'vega-embed';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-vega',
  template: `
    <div class="chart" #chart></div>
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

  @Output()
  vegaClick: EventEmitter<any> = new EventEmitter();


  constructor(private i18nService: I18nService) { }


  ngAfterViewInit(): void {
    this.updateChart();
  }

  updateChart() {
    const formatLocale: FormatLocaleDefinition = this.i18nService.getD3FormatLocaleDefinition();

    const timeFormatLocale: TimeLocaleDefinition = this.i18nService.getD3TimeLocaleDefinition();



    // empty content
    const node = this.chartRef.nativeElement;


    if (!node ) {
      return;
    }

    node.innerHTML = '';

    if (!this._spec) {
      return;
    }

    embed(node, this._spec, {actions: false, formatLocale: formatLocale as unknown as any, timeFormatLocale: timeFormatLocale as unknown as any})
    .then(result => {
      const view = result.view;
      view.addEventListener('click', (_, item) => {
        if (item.datum) {
          this.vegaClick.emit(JSON.parse(JSON.stringify(item.datum)));
        }
      });
    });
  }

}

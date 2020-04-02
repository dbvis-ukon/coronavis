import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, TemplateRef } from '@angular/core';
import {default as embed} from 'vega-embed';
import { VisualizationSpec } from 'vega-embed';
import { I18nService, SupportedLocales } from '../services/i18n.service';

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


  constructor(private i18nService: I18nService) { }


  ngAfterViewInit(): void {
    this.updateChart();
  }

  updateChart() {
    let formatLocale;

    let timeFormatLocale;
    if(this.i18nService.getCurrentLocale() === SupportedLocales.DE_DE) {
      formatLocale = {
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["", "\u00a0€"]
      };

      timeFormatLocale = {
        "dateTime": "%A, der %e. %B %Y, %X",
        "date": "%d.%m.%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
        "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
        "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        "shortMonths": ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
      };
    }

    // ...

    else { // default english
      formatLocale = {
        "decimal": ".",
        "thousands": ",",
        "grouping": [3],
        "currency": ["$", ""]
      };

      timeFormatLocale = {
        "dateTime": "%x, %X",
        "date": "%-m/%-d/%Y",
        "time": "%-I:%M:%S %p",
        "periods": ["AM", "PM"],
        "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      };
    }



    // empty content
    const node = this.chartRef.nativeElement;
    

    if(!node ) {
      return;
    }

    node.innerHTML = '';

    if(!this._spec) {
      return;
    }

    embed(node, this._spec, {actions: false, formatLocale, timeFormatLocale});
  }

}

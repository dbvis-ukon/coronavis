import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { extent, groups, max } from 'd3-array';
import { axisBottom, axisLeft, axisRight, axisTop } from 'd3-axis';
import { formatDefaultLocale } from 'd3-format';
import { scaleBand, scaleLinear, scaleTime } from 'd3-scale';
import { select, Selection } from 'd3-selection';
import { timeDay } from 'd3-time';
import { timeFormatDefaultLocale } from 'd3-time-format';
import { DateTime } from 'luxon';
import { EbrakeData, EbrakeItem } from 'src/app/repositories/ebrake.repository';
import { I18nService } from 'src/app/services/i18n.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import { getDateTime } from 'src/app/util/date-util';
import { EbrakeTooltipComponent } from '../ebrake-tooltip/ebrake-tooltip.component';

@Component({
  selector: 'app-temporal-overview-chart',
  templateUrl: './temporal-overview-chart.component.html',
  styleUrls: ['./temporal-overview-chart.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class TemporalOverviewChartComponent implements OnInit {

  private customPositions: ConnectedPosition[] = [
    {
      overlayX: 'center',
      overlayY: 'top',
      originX: 'center',
      originY: 'bottom',
      offsetX: 5,
      offsetY: 5
    },
    {
      overlayX: 'center',
      overlayY: 'bottom',
      originX: 'center',
      originY: 'top',
      offsetX: 5,
      offsetY: 5
    },
    {
      overlayX: 'end',
      overlayY: 'top',
      originX: 'start',
      originY: 'bottom',
      offsetX: -5,
      offsetY: 5
    },
    {
      overlayX: 'start',
      overlayY: 'bottom',
      originX: 'end',
      originY: 'top',
      offsetX: 5,
      offsetY: -5
    },
    {
      overlayX: 'end',
      overlayY: 'bottom',
      originX: 'start',
      originY: 'top',
      offsetX: -5,
      offsetY: -5
    },
  ];

  ROW_HEIGHT = 20;

  @ViewChild('svg', {static: true})
  private svgRef: ElementRef<SVGSVGElement>;

  @ViewChild('legend', {static: true})
  private legendRef: ElementRef<HTMLDivElement>;

  private svgSel: Selection<SVGSVGElement, undefined, null, undefined>;

  private _data: EbrakeData;

  @Input()
  public set data(data: EbrakeData) {
    this._data = data;

    if (data) {
      this.updateChart(data.data);
    }
  }

  public get data(): EbrakeData {
    return this._data;
  }

  constructor(
    private tooltipService: TooltipService,
    private i18nService: I18nService
  ) { }

  ngOnInit(): void {
    this.svgSel = select(this.svgRef.nativeElement);

    this.updateChart(this._data?.data);
  }

  private shortName(name: string): string {
    return name
      .replace('Landkreis', 'LK')
      .replace('Stadtkreis', 'SK')
      .replace('Kreisfreie Stadt', 'KS');
  }

  // @HostListener('window:resize', ['$event'])
  // onResize(): void {
  //   this.updateChart(this._data.data);
  // }

  updateChart(data: EbrakeItem[]): void {
    if (!this.svgSel) {
      return;
    }
    this.svgSel.select('.chart').remove();
    if (!data) {
      return;
    }

    timeFormatDefaultLocale(this.i18nService.getD3TimeLocaleDefinition());
    formatDefaultLocale(this.i18nService.getD3FormatLocaleDefinition());

    const dataParsed = data.map(d => ({...d, ts_parsed: new Date(d.timestamp), name_parsed: this.shortName(d.name)}));

    const dt = groups(dataParsed, d => d.name_parsed);

    const maxTextWidth = dt.map(d => this.measureText(d[0])).reduce((prev, cur) => cur > prev ? cur : prev, 0);

    const countyIds = dt.map(d => d[0]);

    const rowsScale = scaleBand()
    .range([0, countyIds.length * this.ROW_HEIGHT])
    .domain(countyIds);

    const margin = {top: 20, right: maxTextWidth + 10, bottom: 30, left: maxTextWidth + 10};

    const screenWidth = max([this.legendRef.nativeElement.offsetWidth, 300]);

    const width = screenWidth - margin.left - margin.right;
    const height = rowsScale.range()[1] + (rowsScale.bandwidth() * 2.5) - margin.top - margin.bottom;
      // .padding(0.1);

    const dateExt: [Date, Date] = extent(dataParsed, d => d.ts_parsed);

    const xScale = scaleTime()
      .domain([dateExt[0], DateTime.fromJSDate(dateExt[1]).plus({days: 1}).toJSDate()])
      .range([0, width]);

    const yScale = scaleLinear()
      .domain([0, max(data, d => d['7_day_incidence'])])
      .range([0, rowsScale.bandwidth() - 5]);

    const chartG = this.svgSel
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('class', 'chart')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const rowG = chartG
      .selectAll('.row')
      .data(dt)
      .enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', d => `translate(0, ${rowsScale(d[0])})`);


    rowG
      .append('rect')
      .attr('width', width)
      .attr('height', rowsScale.bandwidth())
      .attr('class', 'background-rect');

    const widthOfOneDay = xScale(new Date('2020-01-02T00:00:00')) - xScale(new Date('2020-01-01T00:00:00'));


    rowG
      .selectAll('.bg.ebrakenone')
      .data(d => d[1])
      .enter()
      .append('rect')
      .attr('class', 'bg')
      .classed('ebrakeunknown', d => !d || d.ebrake100 === null && d.ebrake165 === null)
      .classed('ebrakenone', d => d.ebrake100 === false && d.ebrake165 === false)
      .classed('ebrake100', d => d.ebrake100 === true)
      .classed('ebrake165', d => d.ebrake165 === true)
      .attr('x', d => xScale(d.ts_parsed))
      .attr('width', widthOfOneDay)
      .attr('height', rowsScale.bandwidth())
      .on('mouseenter', (evt, d) => {
        const t = this.tooltipService.openAtElementRef(EbrakeTooltipComponent, evt.target, null, this.customPositions);
        t.data = d;

        select(evt.target).classed('highlighted', true);
      })
      .on('mouseleave', () => {
        this.tooltipService.close();

        rowG.selectAll('.bg.highlighted')
        .classed('highlighted', false);
      });

    const tomorrowM = getDateTime('now').plus({days: 1}).startOf('day');

    rowG
      .append('rect')
      .attr('class', 'prognosis')
      .attr('x', xScale(tomorrowM.toJSDate()))
      .attr('width', xScale(DateTime.fromJSDate(dateExt[1]).plus({days: 1}).toJSDate()) - xScale(tomorrowM.toJSDate()))
      .attr('height', rowsScale.bandwidth());

    const sunHoliday = rowG
      .selectAll('.sunholiday')
      .data(d => d[1].filter(d1 => d1.holiday !== null || d1.ts_parsed.getDay() === 0))
      .enter();

    sunHoliday
      .append('line')
      .classed('sunholiday', true)
      .attr('x1', d => xScale(d.ts_parsed))
      .attr('x2', d => xScale(d.ts_parsed))
      .attr('y1', 0)
      .attr('y2', rowsScale.bandwidth());

    sunHoliday
      .append('line')
      .classed('sunholiday', true)
      .attr('x1', d => xScale(d.ts_parsed) + widthOfOneDay)
      .attr('x2', d => xScale(d.ts_parsed) + widthOfOneDay)
      .attr('y1', 0)
      .attr('y2', rowsScale.bandwidth());

    rowG
      .selectAll('.bar')
      .data(d => d[1].filter(d1 => d1['7_day_incidence']))
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.ts_parsed) + ((widthOfOneDay / 2) - yScale(d['7_day_incidence']) / 2))
      .attr('y', d => (rowsScale.bandwidth() / 2) - (yScale(d['7_day_incidence']) / 2))
      .attr('width', d => yScale(d['7_day_incidence']))
      .attr('height', d => yScale(d['7_day_incidence']))
      .classed('ebrake100', d => d['7_day_incidence'] >= 100 && d['7_day_incidence'] < 165)
      .classed('ebrake165', d => d['7_day_incidence'] >= 165);


    chartG
      .append('g')
      .call(axisLeft(rowsScale));

    const shiftXTicks = (sel: Selection<SVGGElement, unknown, undefined, unknown>) => {
      sel.selectAll<SVGGElement, any>('.tick')
      .attr('transform', (_, i, n) => {
        const curTransform: string = select(n[i]).attr('transform');

        const curX = parseFloat(curTransform.split(',')[0].replace('translate(', ''));
        const newXAdd = widthOfOneDay / 2;

        if ((curX + newXAdd) > width) {
          select(n[i]).remove();
          return null;
        }

        return `${curTransform}, translate(${newXAdd}, 0)`;
      });
    };

    chartG
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(axisBottom(xScale).ticks(timeDay.every(2)))
      .call(shiftXTicks);

    chartG
      .append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(axisRight(rowsScale));

    chartG
      .append('g')
      .call(axisTop(xScale).ticks(timeDay.every(2)))
      .call(shiftXTicks);

    // const today = getDateTime('now').startOf('day').toJSDate();
    // const tomorrow = tomorrowM.toJSDate();

    // chartG
    //   .append('polygon')
    //   .attr('class', 'today')
    //   .attr('transform', `translate(${xScale(today) + widthOfOneDay / 2}, -5)`)
    //   .attr('points', '-2,0 2,0 0,4');

    // chartG
    //   .append('line')
    //   .attr('class', 'today')
    //   .attr('x1', xScale(today))
    //   .attr('x2', xScale(today))
    //   .attr('y1', 0)
    //   .attr('y2', height);

    //   chartG
    //   .append('line')
    //   .attr('class', 'today')
    //   .attr('x1', xScale(tomorrow))
    //   .attr('x2', xScale(tomorrow))
    //   .attr('y1', 0)
    //   .attr('y2', height);
  }

  /**
   * taken from https://bl.ocks.org/tophtucker/62f93a4658387bb61e4510c37e2e97cf
   */
  private measureText(str: string, fontSize = 10) {
    const widths = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.15625,0.3,0.4,0.7,0.6,0.9,0.7,0.2,0.4,0.4,0.4,0.6,0.3,0.4,0.3,0.5,0.6,0.55625,0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.3,0.3,0.6,0.6,0.6,0.6,1.1,0.8,0.7,0.8,0.7234375,0.7,0.6109375,0.8,0.7234375,0.3,0.5,0.8,0.6,0.834375,0.7234375,0.8,0.7,0.8,0.8,0.7,0.8,0.7234375,0.8,1.1,0.8,0.8,0.8,0.3,0.5,0.3,0.6,0.7,0.334375,0.6,0.6,0.6,0.6,0.6,0.5,0.6,0.6,0.2234375,0.3234375,0.6,0.2234375,0.834375,0.6,0.6,0.6,0.6,0.4,0.5,0.4,0.6,0.7,0.9,0.7,0.7,0.6,0.5,0.2609375,0.5,0.6];
    const avg = 0.5889638157894739;
    return str
      .split('')
      .map(c => c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg)
      .reduce((cur, acc) => acc + cur) * fontSize;
  }

}

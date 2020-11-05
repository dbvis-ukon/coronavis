import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import moment, { Moment } from 'moment';
import { NouiFormatter } from 'ng2-nouislider';
import { BehaviorSubject, interval, NEVER, Observable } from 'rxjs';
import { filter, map, reduce, repeatWhen, switchMap, takeUntil } from 'rxjs/operators';
import { MapOptions } from '../map/options/map-options';
import { ConfigService } from '../services/config.service';
import { getMoment, getStrDate } from '../util/date-util';
import { ExtentRepository } from '../repositories/extent.repository';

class TimeFormatter implements NouiFormatter {
  constructor(public startDay: Moment, private datePipe: DatePipe) {}

  to(value: number): string {
    return this.datePipe.transform(this.startDay.clone().add(value, 'days').toDate(), 'shortDate');
  }

  from(value: string): number {
    return getMoment(value).diff(this.startDay, 'days');
  }
}

@Component({
  selector: 'app-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.less']
})
export class TimesliderComponent implements OnInit {

  timeFormatter: TimeFormatter;

  nouiConfig;

  numTicks = 10;

  currentTime = 0;

  timeExtent: [number, number] = [0, 10];


  private _mo: MapOptions;

  @Input()
  set mapOptions(mo: MapOptions) {
    this._mo = mo;
  }

  get mapOptions(): MapOptions {
    return this._mo;
  }

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  modePlaying$ = new BehaviorSubject<boolean>(false);

  stepSize = 1;

  constructor(
    private extentRepo: ExtentRepository,
    private configService: ConfigService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.extentRepo.getExtent()
    .pipe(
      map<[string, string], [Moment, Moment]>(d => [getMoment(d[0]), getMoment(d[1])]),
      reduce((acc, val) => {
        if (!acc[0] || acc[0] > val[0]) {
          acc[0] = val[0];
        }

        if (!acc[1] || acc[1] < val[1]) {
          acc[1] = val[1];
        }

        return acc;
      }),
      ).subscribe(extent => {
        const firstDay = extent[0].startOf('day');
        const lastDay = extent[1].startOf('day');

        this.timeExtent = [0, lastDay.diff(firstDay, 'days')];

        this.timeFormatter = new TimeFormatter(firstDay, this.datePipe);

        this.nouiConfig = {
          tooltips: this.timeFormatter,
          range: {
            min: this.timeExtent[0],
            max: this.timeExtent[1]
          },
          step: 1
        };

        if (this._mo) {
          this.currentTime = this.timeFormatter.from(getStrDate(getMoment(this._mo.bedGlyphOptions.date)));
        }

        this.numTicks = this.timeExtent[1] - this.timeExtent[0];
      });



    const source$ = interval(1000);


    const ons$ = this.modePlaying$.pipe(filter(v => !v));
    const offs$ = this.modePlaying$.pipe(filter(v => v));

    source$.pipe(
          takeUntil(ons$),
          repeatWhen(() => offs$)
        )
      .subscribe(d => {
        this.onTimer();
      });
  }

  nouiSliderChanging(value: number) {
    this.sliderChanging(value);
  }

  nouiSliderChanged(value: number) {
    this.sliderChanged(value);
  }

  matSliderChanging(evt: MatSliderChange) {
    this.sliderChanging(evt.value);
  }

  matSliderChanged(evt: MatSliderChange) {
    this.sliderChanged(evt.value);
  }


  private sliderChanging(value: number) {
    this.emit(value, true);
  }

  private sliderChanged(value: number) {
    this.emit(value, false);
  }

  // function is called for every interval
  onTimer() {
    let nextTime = this.currentTime + 1;

    if (nextTime > this.timeExtent[1]) {
      nextTime = this.timeExtent[0];
    }

    this.currentTime = nextTime;

    this.emit(nextTime, false);
  }

  pausableInterval(ms: number, pauser: Observable<boolean>) {
    let x = 0;
    const source = interval(ms);

    return pauser.pipe(switchMap(paused => paused ? NEVER : source.pipe(map(() => x++))));
  }

  emit(numDays: number, changing: boolean) {
    if (changing) {
      return;
    }
    // if(changing && (this._mo.bedGlyphOptions.enabled || this._mo.bedBackgroundOptions.enabled)
    //   && (this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none || this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.county)) {
    //   // do not update with single glyphs as it causes too much lag
    //   return;
    // }

    // workaround to get to the correct date
    numDays++;

    let date = getStrDate(this.sliderValueToMoment(numDays));
    if (date === getStrDate(moment())) {
      date = 'now';
    }

    this.mapOptionsChange.emit(this.configService.overrideMapOptions(this._mo, {
      bedGlyphOptions: {
        date
      },
      bedBackgroundOptions: {
        date
      },
      covidNumberCaseOptions: {
        date
      }
    }));
  }

  sliderValueToMoment(val: number): Moment {
    return this.timeFormatter.startDay.clone().add(val, 'days');
  }

  momentToSliderValue(mom: Moment): number {
    return mom.diff(this.timeFormatter.startDay, 'days');
  }

}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Feature, Point } from 'geojson';
import moment from 'moment';
import { NouiFormatter } from 'ng2-nouislider';
import { BehaviorSubject, interval, NEVER, Observable } from 'rxjs';
import { filter, flatMap, map, reduce, repeatWhen, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { MapOptions } from '../map/options/map-options';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { ConfigService } from '../services/config.service';

export class TimeFormatter implements NouiFormatter {
  to(value: number): string {
    return moment.unix(value).format('YYYY-MM-DD');
  };

  from(value: string): number {
    return moment(value).unix();
  }
}

@Component({
  selector: 'app-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.less']
})
export class TimesliderComponent implements OnInit {

  nouiConfig = {
    tooltips: new TimeFormatter()
  }

  numTicks = 10;

  currentTimeDate: Date = moment().endOf('day').toDate();

  currentTime: number = moment().endOf('day').unix();

  timeExtent: [number, number] = [moment('2020-03-12').startOf('day').unix(), moment().endOf('day').unix()];


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

  constructor(
    private diviRepo: QualitativeDiviDevelopmentRepository,
    private configService: ConfigService,
  ) { }

  ngOnInit(): void {
    this.diviRepo.getDiviDevelopmentSingleHospitals()
    .pipe(
      flatMap(d => d.features),
      map<Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>, [Date, Date]>(d => [new Date(d.properties.developments[0].timestamp), new Date(d.properties.developments[d.properties.developments.length - 1].timestamp)]),
      reduce((acc, val) => {
        if(!acc[0] || acc[0] > val[0]) {
          acc[0] = val[0];
        }

        if(!acc[1] || acc[1] < val[1]) {
          acc[1] = val[1];
        }

        return acc;
      }),
      tap(d => console.log('extent date', d)),
      map<[Date, Date], [number, number]>(extent => [moment(extent[0]).startOf('day').unix(), moment(extent[1]).endOf('day').unix()]),
      tap(d => console.log('extent', d))
      ).subscribe(extent => {
        this.timeExtent = extent;

        this.numTicks = moment.unix(this.timeExtent[1]).diff(moment.unix(this.timeExtent[0]), 'days');
      });



      const source$ = interval(2000);


      const ons$ = this.modePlaying$.pipe(filter(v=>!v));
      const offs$ = this.modePlaying$.pipe(filter(v=>v));

      source$.pipe(
          takeUntil(ons$),
          repeatWhen(()=>offs$)
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
    const mDate = moment.unix(value).endOf('day');
    this.currentTimeDate = mDate.toDate();
    this.emit(mDate.format('YYYY-MM-DD'), true);
  }

  private sliderChanged(value: number) {
    const mDate = moment.unix(value);
    this.currentTimeDate = mDate.toDate();

    this.emit(mDate.format('YYYY-MM-DD'), false);
  }

  // function is called for every interval
  onTimer() {
    let nextTime = moment.unix(this.currentTime).add(1, 'day').unix();

    if(nextTime > this.timeExtent[1]) {
      nextTime = this.timeExtent[0];
    }

    this.currentTime = nextTime;

    const date = moment.unix(nextTime).format('YYYY-MM-DD');

    this.emit(date, false);
  }

  pausableInterval(ms: number, pauser: Observable<boolean>) {
    let x = 0;
    const source = interval(ms);
  
    return pauser.pipe(switchMap(paused => paused ? NEVER : source.pipe(map(() => x++))));
  }

  emit(date: string, changing: boolean) {
    if(changing && (this._mo.bedGlyphOptions.enabled || this._mo.bedBackgroundOptions.enabled)
      && (this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none || this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.county)) {
      // do not update with single glyphs as it causes too much lag
      return;
    }


    this.mapOptionsChange.emit(this.configService.overrideMapOptions(this._mo, {
      bedGlyphOptions: {
        date: date
      },
      bedBackgroundOptions: {
        date: date
      }
    }));
  }

}

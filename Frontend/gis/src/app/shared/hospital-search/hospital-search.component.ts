import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Feature, Point } from 'geojson';
import { LatLngLiteral } from 'leaflet';
import { Observable, of } from 'rxjs';
import { filter, mergeMap, startWith, switchMap, take, toArray } from 'rxjs/operators';
import { SingleHospitalOut } from 'src/app/repositories/types/out/single-hospital-out';

export interface Searchable {
  /**
   * Name of hospital, county, etc
   */
  name: string;

  /**
   * E.g., address or description
   */
  addition?: string;

  /**
   * The geo point
   */
  point?: LatLngLiteral;

  zoom?: number;
}

@Component({
  selector: 'app-hospital-search',
  templateUrl: './hospital-search.component.html',
  styleUrls: ['./hospital-search.component.less']
})
export class HospitalSearchComponent implements OnInit {

  myControl = new FormControl();


  // tslint:disable-next-line:no-input-rename
  @Input('data')
  data$: Observable<Searchable[]>;

  @Output()
  selectedHospital = new EventEmitter<Searchable>();


  filteredOptions: Observable<Searchable[]>;

  private _t: number;

  @Input()
  set reset(t: number) {
    this._t = t;

    this.myControl.setValue('');
  }

  get reset(): number {
    return this._t;
  }


  constructor(
  ) { }

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => this._filter(value)),
    );
  }

  private _filter(value: string): Observable<Searchable[]> {
    if (!this.data$) {
      return of([]);
    }

    const filterValue = value.toLowerCase();

    return this.data$
    .pipe(
      mergeMap(d => d),
      filter(d => d.name.toLowerCase().indexOf(filterValue) > -1 || d.addition?.toLowerCase().indexOf(filterValue) > -1),
      toArray()
    );
  }


  selected(evt: MatAutocompleteSelectedEvent) {
    const name = evt.option.value;

    this.data$
    .pipe(
      mergeMap(d => d),
      filter(d => (d.name + ':' + d.addition) === name),
      take(1)
    )
    .subscribe(d => {
      if (d) {
        this.selectedHospital.emit(d);
      }
    });
  }

  displayFn(h: Feature<Point, SingleHospitalOut<any>>) {
    return h.properties.name;
  }

}

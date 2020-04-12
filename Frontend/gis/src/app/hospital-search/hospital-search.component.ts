import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { HospitalUtilService } from '../services/hospital-util.service';

export type HospitalSearchFeaturePermissible = Feature<Point, SingleHospitalOut<any> | Feature<MultiPolygon, AggregatedHospitalOut<any>>>;
export type HospitalSearchFeatureCollectionPermissible = FeatureCollection<Point, SingleHospitalOut<any>> | FeatureCollection<MultiPolygon, AggregatedHospitalOut<any>>;

@Component({
  selector: 'app-hospital-search',
  templateUrl: './hospital-search.component.html',
  styleUrls: ['./hospital-search.component.less']
})
export class HospitalSearchComponent implements OnInit {

  myControl = new FormControl();


  @Input('hospitals')
  options: HospitalSearchFeatureCollectionPermissible;

  @Output()
  selectedHospital = new EventEmitter<HospitalSearchFeaturePermissible>();

  
  filteredOptions: Observable<Feature<Point, SingleHospitalOut<any>>[] | Feature<MultiPolygon, AggregatedHospitalOut<any>>[]>;

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
    private hospitalUtil: HospitalUtilService
  ) { }

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value)),
    );
  }

  private _filter(value: string): Feature<Point, SingleHospitalOut<any>>[] | Feature<MultiPolygon, AggregatedHospitalOut<any>>[] {
    if(!this.options) {
      return [];
    }

    const filterValue = value.toLowerCase();

    if(this.hospitalUtil.isSingleHospitalFeatureCollection(this.options)) {
      return this.options.features.filter(option => {
        const str1 = option.properties.name.toLowerCase();
        const str2 = option.properties.address.toLowerCase();
        // const str3 = option.properties.plz?.toLowerCase();
        // const str4 = option.properties.ort?.toLowerCase();
        return str1.indexOf(filterValue) > -1
        || str2.indexOf(filterValue) > -1
        // || str3.indexOf(filterValue) > -1
        // || str4.indexOf(filterValue) > -1
      });
    } else {
      const opts = (this.options as FeatureCollection<MultiPolygon, AggregatedHospitalOut<any>>);
      return opts.features.filter(option => {
        const str1 = option.properties.name.toLowerCase();
        return str1.indexOf(filterValue) > -1;
      });
    }

    
  }


  selected(evt: MatAutocompleteSelectedEvent) {
    const name = evt.option.value;

    const h = (this.options as FeatureCollection<any, SingleHospitalOut<any>>).features.filter(h => h.properties.name === name);
    if(h.length > 0) {
      this.selectedHospital.emit(h[0]);
    }
  }

  displayFn(h: Feature<Point, SingleHospitalOut<any>>) {
    return h.properties.name;
  }

}

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatAutocompleteSelectedEvent, MatAutocomplete} from '@angular/material/autocomplete';
import {Observable} from 'rxjs';
import {filter, mergeMap, startWith, switchMap, toArray} from 'rxjs/operators';
import { RegionRepository } from 'src/app/repositories/region.repository';
import { Region } from 'src/app/repositories/types/in/region';

/**
 * @title Chips Autocomplete
 */
@Component({
  selector: 'app-region-selector',
  templateUrl: 'region-selector.component.html',
  styleUrls: ['region-selector.component.less'],
})
export class RegionSelectorComponent implements OnInit {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  fruitCtrl = new FormControl();

  allRegions: Observable<Region[]>;
  filteredRegions: Observable<Region[]>;

  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  @Input()
  public selectedRegions: Region[] = [];

  @Output()
  public selectedRegionsChange: EventEmitter<Region[]> = new EventEmitter();

  constructor(private regionRepo: RegionRepository) {
    this.filteredRegions = this.fruitCtrl.valueChanges.pipe(
        startWith(null),
        switchMap((search: string | null) => this._filter(search))
    );
  }

  ngOnInit(): void {
    this.allRegions = this.regionRepo.getAll();
  }

  remove(region: Region): void {
    const index = this.selectedRegions.indexOf(region);

    if (index >= 0) {
      this.selectedRegions.splice(index, 1);

      this.selectedRegionsChange.emit([...this.selectedRegions]);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const newRegion: Region = event.option.value;
    if (this.selectedRegions.findIndex(r => r.id === newRegion.id) === -1) {
      this.selectedRegions.push(newRegion);
    }

    this.fruitInput.nativeElement.value = '';
    this.fruitCtrl.setValue(null);

    this.selectedRegionsChange.emit([...this.selectedRegions]);
  }

  private _filter(value: string | Region | null): Observable<Region[]> {
    if (!value) {
      return this.allRegions;
    }

    if ((value as Region).id) {
      return this.allRegions;
    }

    // console.log('value', value);

    const filterValue = (value as string).toLowerCase();

    return this.allRegions
      .pipe(
        mergeMap(arr => arr),
        filter(region => region.name.toLowerCase().indexOf(filterValue) === 0),
        toArray()
      );
  }
}

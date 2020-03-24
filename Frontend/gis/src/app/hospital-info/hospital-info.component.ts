import { Component, OnInit, Input } from '@angular/core';
import { DiviHospital } from '../services/divi-hospitals.service';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: DiviHospital

  constructor() { }

  ngOnInit(): void {
  }

}

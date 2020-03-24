import { Component, OnInit, Input } from '@angular/core';
import { DiviHospital } from '../services/divi-hospitals.service';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  contact: string;
  url: boolean;

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: DiviHospital

  constructor() { }

  ngOnInit(): void {
    if(this.data.Kontakt.indexOf('http')>-1){
      this.contact = 'http' + this.data.Kontakt.split('http')[1];
      this.url = true;
    }else{
      this.contact = this.data.Kontakt;
      this.url = false;
    }
  }

}

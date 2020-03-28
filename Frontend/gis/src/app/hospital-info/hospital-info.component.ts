import { Component, OnInit, Input } from '@angular/core';
import { DiviHospital } from '../services/divi-hospitals.service';
import { ColormapService } from '../services/colormap.service';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  contact: string;
  url: boolean;

  contactMsg: string;

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: DiviHospital;



  constructor(private colormapService: ColormapService) { }

  ngOnInit(): void {
    if(this.data.Webaddress.indexOf('http') > -1) {
      this.contact = 'http' + this.data.Webaddress.split('http')[1];
      this.url = true;

      this.contactMsg = this.data.Webaddress.replace(this.contact, '').replace('Website', '').trim();

      if(this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    } else {
      this.contact = this.data.Webaddress;
      this.url = false;

      this.contactMsg = this.data.Webaddress;
    }
  }

  getCapacityStateColor(capacityState: string): string {
    return this.colormapService.getSingleHospitalColormap()(capacityState);
  }

}

import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  @Input()
  mode: 'dialog' | 'tooltip';

  constructor() { }

  ngOnInit(): void {
  }

}

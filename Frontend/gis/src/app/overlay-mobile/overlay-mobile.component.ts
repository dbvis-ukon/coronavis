import { Component, OnInit } from '@angular/core';
import {BreakpointObserver} from "@angular/cdk/layout";

@Component({
  selector: 'app-overlay-mobile',
  templateUrl: './overlay-mobile.component.html',
  styleUrls: ['./overlay-mobile.component.less']
})
export class OverlayMobileComponent implements OnInit {
  showOverlayMobile = false;

  constructor( private breakPointObserver: BreakpointObserver) {}


  ngOnInit(): void {
    //close info box if mobile
    const isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    if(isSmallScreen){
      this.showOverlayMobile = true;
    }
  }

}

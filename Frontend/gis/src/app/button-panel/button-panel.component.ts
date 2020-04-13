import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AboutComponent } from '../about/about.component';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { IconService } from '../services/icon.service';
import { ShareDialogComponent } from '../share-dialog/share-dialog.component';

@Component({
  selector: 'app-button-panel',
  templateUrl: './button-panel.component.html',
  styleUrls: ['./button-panel.component.less']
})
export class ButtonPanelComponent implements OnInit {

  @Input('mapOptions')
  mo: MapOptions;

  @Input('mapLocationSettings')
  mls: MapLocationSettings;

  @Input()
  mode: 'vertical' | 'horizontal';



  twitterLoaded = false;

  constructor(
    private dialogService: MatDialog,
    private iconService: IconService
  ) {
  }


  ngOnInit(): void {
    this.iconService.twitterLoaded$.subscribe(loaded => this.twitterLoaded = loaded);
  }

  openAbout() {
    this.dialogService.open(AboutComponent, {
		  panelClass: 'popup-panel-white-glass-background'
	  });
  }

  openVideo() {
    window.open('https://video.coronavis.dbvis.de', '_blank');
    // location.href = 'https://video.coronavis.dbvis.de';
  }




  openHelp() {
    this.dialogService.open(HelpDialogComponent);
  }

  openShare() {
    this.dialogService.open(ShareDialogComponent, {
      minWidth: '80vw',
      data: {
        mo: JSON.parse(JSON.stringify(this.mo)),
        mls: JSON.parse(JSON.stringify(this.mls))
      }
    });
  }

}

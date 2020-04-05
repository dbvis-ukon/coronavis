import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AboutComponent } from '../about/about.component';
import { I18nService, SupportedLocales } from '../services/i18n.service';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { ShareDialogComponent } from '../share-dialog/share-dialog.component';
import { MapOptions } from '../map/options/map-options';
import { MapLocationSettings } from '../map/options/map-location-settings';

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

  supportedLocales: string[];

  selectedLocale: SupportedLocales;

  constructor(
    private dialogService: MatDialog,
    private i18nService: I18nService
  ) { }

  ngOnInit(): void {

    
    this.supportedLocales = this.i18nService.getSupportedLocales();

    this.i18nService.currentLocale().subscribe(l => {
      this.selectedLocale = l;
    })
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

  changeLocale(evt) {
    this.i18nService.updateLocale(evt.value);

    const url = evt.value.slice(0,2);

    location.href = `/${url}/`;
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

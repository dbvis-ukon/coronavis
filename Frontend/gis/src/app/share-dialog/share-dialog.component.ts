import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { timer } from 'rxjs';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { UrlHandlerService } from '../services/url-handler.service';

@Component({
  selector: 'app-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.less']
})
export class ShareDialogComponent implements OnInit {

  mo: MapOptions;

  mls: MapLocationSettings;

  url: string;

  iframe: string;


  urlcopied = false;

  constructor(
    public dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {mo: MapOptions, mls: MapLocationSettings},
    private urlHandlerService: UrlHandlerService
  ) { }

  ngOnInit(): void {
    this.mo = this.data.mo;
    this.mls = this.data.mls;

    this.update();
  }

  close(): void {
    this.dialogRef.close();
  }

  update() {
    this.url = this.urlHandlerService.getUrl(this.mo, this.mls);

    this.iframe = `<iframe name="CoronaVis" src="${this.url}" frameborder="0" width="600" height="400"></iframe>`;
  }

  copyInputMessage(inputElement){
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);

    this.urlcopied = true;

    timer(2000).subscribe(() => this.urlcopied = false);
  }
}

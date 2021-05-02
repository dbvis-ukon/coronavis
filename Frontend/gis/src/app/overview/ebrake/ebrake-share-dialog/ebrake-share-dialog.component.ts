import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { timer } from 'rxjs';
import { Region } from 'src/app/repositories/types/in/region';

@Component({
  selector: 'app-ebrake-share-dialog',
  templateUrl: './ebrake-share-dialog.component.html',
  styleUrls: ['./ebrake-share-dialog.component.less']
})
export class EbrakeShareDialogComponent implements OnInit {

  showRegions = true;
  showButtons = false;
  showFooter = true;
  showHeader = false;

  lang: 'auto' | 'de' | 'en' = 'auto';

  url: string;

  iframe: string;


  urlcopied = false;

  constructor(
    public dialogRef: MatDialogRef<EbrakeShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {regions: Region[]},
  ) { }

  ngOnInit(): void {
    this.update();
  }

  close(): void {
    this.dialogRef.close();
  }

  update() {
    let url = 'https://' + window.location.hostname;

    if (this.lang !== 'auto') {
      url += '/' + this.lang;
    }

    if (this.showHeader) {
      url += '/overview';
    }

    url += '/ebrake';

    const params = [];

    if (this.data.regions.length > 0) {
      params.push('ids=' + this.data.regions.map(d => d.id).join(','));
    }

    if (!this.showRegions) {
      params.push('regions=false');
    }

    if (!this.showFooter) {
      params.push('footer=false');
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    this.url = url;

    this.iframe = `<iframe name="CoronaVis" src="${this.url}" frameborder="0" width="1000" height="400"></iframe>`;
  }

  copyInputMessage(inputElement){
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);

    this.urlcopied = true;

    timer(2000).subscribe(() => this.urlcopied = false);
  }
}

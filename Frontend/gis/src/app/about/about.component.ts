import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.less']
})
export class AboutComponent implements OnInit {

  frontendVersion: string;

  apiVersion: string;

  tileServerVersion: string;

  constructor(
    public dialogRef: MatDialogRef<AboutComponent>,
    private http: HttpClient) {}

  ngOnInit(): void {
    this.frontendVersion = environment.version;

    this.http.get(
      `${environment.apiUrl}version`, { responseType: 'text'} )
    .subscribe(v => {
      this.apiVersion = v;
    });

    this.http.get(
      `${environment.tileServerUrl}version`, { responseType: 'text' }
    )
    .subscribe(v => {
      this.tileServerVersion = v;
    });

  }



  close(): void {
    this.dialogRef.close();
  }

}

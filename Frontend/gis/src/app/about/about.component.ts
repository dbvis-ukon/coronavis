import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {

  frontendVersion$: Observable<string>;

  apiVersion$: Observable<string>;

  tileServerVersion$: Observable<string>;

  constructor(
    public dialogRef: MatDialogRef<AboutComponent>,
    private http: HttpClient) {}

  ngOnInit(): void {
    this.frontendVersion$ = of(environment.version);

    this.apiVersion$ = this.http.get(
      `${environment.apiUrl}version`, { responseType: 'text'} );

    this.tileServerVersion$ = this.http.get(
      `${environment.tileServerUrl}version`, { responseType: 'text' }
    )

  }



  close(): void {
    this.dialogRef.close();
  }

}

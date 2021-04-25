import { Component, Inject } from '@angular/core';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ebrake-snackbar',
  template: `
  <div i18n="@@snackBarEBrake">
    Seit dem 23.04.2021 gilt das 4. Bevölkerungsschutzgesetz. In der Karte werden alle Kreise dargestellt für die die "Bundesnotbremse" gilt.
    <a target="_blank" href="https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/guv-19-lp/4-bevschg-faq.html#c21101">Mehr Informationen gibt es beim Bundesgesundheitsministerium. <mat-icon inline="true">launch</mat-icon></a>
  </div>
  <button mat-button (click)="snackBar.dismiss()">OK</button>
  `,
  styleUrls: ['./ebrake-snackbar.component.less']
})
export class EbrakeSnackbarComponent {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any,
              public snackBar: MatSnackBar) {
  }
}

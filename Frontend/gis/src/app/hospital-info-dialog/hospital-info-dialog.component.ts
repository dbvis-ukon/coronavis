import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DiviHospital } from '../services/divi-hospitals.service';

@Component({
  selector: 'app-hospital-info-dialog',
  templateUrl: './hospital-info-dialog.component.html',
  styleUrls: ['./hospital-info-dialog.component.less']
})
export class HospitalInfoDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<HospitalInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DiviHospital) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}

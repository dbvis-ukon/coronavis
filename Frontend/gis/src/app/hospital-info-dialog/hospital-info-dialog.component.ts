import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { HospitalUtilService } from '../services/hospital-util.service';

@Component({
  selector: 'app-hospital-info-dialog',
  templateUrl: './hospital-info-dialog.component.html',
  styleUrls: ['./hospital-info-dialog.component.less']
})
export class HospitalInfoDialogComponent implements OnInit {

  isSingleHospital = false;
  totalNumberOfHospitals = 0;

  constructor(
    public dialogRef: MatDialogRef<HospitalInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {data: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>; options: BedGlyphOptions | BedBackgroundOptions},
    private hospitalUtilService: HospitalUtilService) {}


  ngOnInit(): void {
    this.isSingleHospital = this.hospitalUtilService.isSingleHospital(this.data.data);

    if (!this.isSingleHospital) {
      this.totalNumberOfHospitals = this.hospitalUtilService.getNumberOfHospitals(this.data.data as AggregatedHospitalOut<QualitativeTimedStatus>);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

}

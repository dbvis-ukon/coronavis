import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CovidNumberCaseOptions } from '../../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from '../../services/case-util.service';

@Component({
  selector: 'app-case-dialog',
  templateUrl: './case-dialog.component.html',
  styleUrls: ['./case-dialog.component.less']
})
export class CaseDialogComponent implements OnInit {

  currentTimedStatus: RKICaseTimedStatus;

  constructor(
    public dialogRef: MatDialogRef<CaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions},
    private caseUtil: CaseUtilService
  ) { }

  ngOnInit(): void {
    this.currentTimedStatus = this.caseUtil.getTimedStatusWithOptions(this.data.data, this.data.options);
  }

  close() {
    this.dialogRef.close();
  }
}

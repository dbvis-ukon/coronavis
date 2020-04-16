import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from '../services/types/quantitative-aggregated-rki-cases-over-time';

@Component({
  selector: 'app-case-dialog',
  templateUrl: './case-dialog.component.html',
  styleUrls: ['./case-dialog.component.less']
})
export class CaseDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<CaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {data: QuantitativeAggregatedRkiCasesOverTimeProperties, options: CovidNumberCaseOptions},
  ) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close();
  }
}

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DiviHospital } from '../services/divi-hospitals.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.less']
})
export class AboutComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AboutComponent>) {}

  ngOnInit(): void {
  }



  close(): void {
    this.dialogRef.close();
  }

}

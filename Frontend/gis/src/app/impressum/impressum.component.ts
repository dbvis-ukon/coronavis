import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-impressum',
  templateUrl: './impressum.component.html',
  styleUrls: ['./impressum.component.less']
})
export class ImpressumComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ImpressumComponent>) {}

  ngOnInit(): void {
  }



  close(): void {
    this.dialogRef.close();
  }

}

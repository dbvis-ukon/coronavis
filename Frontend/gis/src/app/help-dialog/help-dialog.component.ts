import { BreakpointObserver } from "@angular/cdk/layout";
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.less']
})

export class HelpDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    private breakPointObserver: BreakpointObserver
  ) { }

  public isSmallScreen;

  ngOnInit(): void {
    //close help dialog if mobile
    this.isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    //if(isSmallScreen){
    //  this.dialogRef.close();
    //}
  }

  onResize(event){
    this.isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
  }

  close(): void {
    this.dialogRef.close();
  }

}

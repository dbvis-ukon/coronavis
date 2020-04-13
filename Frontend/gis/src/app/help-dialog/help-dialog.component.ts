import { BreakpointObserver } from "@angular/cdk/layout";
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.less']
})

export class HelpDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    private breakPointObserver: BreakpointObserver,
    private translationService: TranslationService
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

  getTabLabel(tabid): string{
    switch(tabid){
      case 1: return this.translationService.translate('Das Projekt'); // this.translationService.translate(this.isSmallScreen ? 'Projekt' : 'Das Projekt')
    }
    return '';
  }

}

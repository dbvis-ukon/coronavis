import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-title-edit-dialog',
  templateUrl: './title-edit-dialog.component.html',
  styleUrls: ['./title-edit-dialog.component.less']
})
export class TitleEditDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<TitleEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public title: string) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}

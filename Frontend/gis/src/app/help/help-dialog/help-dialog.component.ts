import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class HelpDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    private breakPointObserver: BreakpointObserver
  ) { }

  public isSmallScreen$: Observable<BreakpointState>;

  isSmallScreen: boolean;

  ngOnInit(): void {
    this.isSmallScreen$ = this.breakPointObserver.observe('(max-width: 500px)');

    this.isSmallScreen$.subscribe(s => this.isSmallScreen = s.matches);
  }

  close(): void {
    this.dialogRef.close();
  }

}

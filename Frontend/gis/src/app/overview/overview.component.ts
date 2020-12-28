import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UrlHandlerService } from '../services/url-handler.service';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.less']
})
export class OverviewComponent implements OnInit {

  @ViewChild('snav', {static: true})
  snav: MatSidenav;

  @ViewChild('dataWarning', {static: true})
  dataWarning: ElementRef<HTMLSpanElement>;

  isMobile$: Observable<boolean>;


  constructor(
    public urlHandler: UrlHandlerService,
    private breakpointObserver: BreakpointObserver,
    private matSnackBar: MatSnackBar
  ) {
    this.isMobile$ = this.breakpointObserver.observe('(max-width: 1150px)')
    .pipe(
      map(d => d.matches)
    );
  }

  ngOnInit(): void {
    this.matSnackBar.open(this.dataWarning.nativeElement.textContent, 'OK', {
      duration: 120000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: 'snackbar-warning'
    })
  }

  navigateAndCloseSidenav(url: string) {
    this.snav.close();
  }

}

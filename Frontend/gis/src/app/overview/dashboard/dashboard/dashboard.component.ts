import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { from, Observable, timer } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { Dashboard } from 'src/app/repositories/types/in/dashboard';
import { ChartService, Item, MarkdownItem, MultiLineChartItem } from 'src/app/services/chart.service';
import { ConfigService } from 'src/app/services/config.service';
import { SettingsComponent } from '../settings/settings.component';
import { TitleEditDialogComponent } from '../title-edit-dialog/title-edit-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  @ViewChild('pleaseWait', {static: false})
  pleaseWaitDiv: ElementRef<HTMLDivElement>;

  pleaseWait = false;

  dashboard: Dashboard;
  titleEditMode = false;

  private containerWidth: number;

  constructor(
    private dialog: MatDialog,
    private chartService: ChartService,
    private configService: ConfigService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    this.route.data.subscribe((data: {dashboard: Dashboard}) => {
      this.dashboard = data.dashboard;
      this.updateContainerWidth()
        .subscribe(containerWidth => {
          from(this.dashboard.items)
            .pipe(
              mergeMap(d => this.chartService.updateChartFull(d)),
              toArray()
            )
            .subscribe(items => {
              this.chartService.updateChartsShallow(items, containerWidth);

              this.pleaseWait = false;
            });
        });
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateChartsShallow(this.dashboard.items);
  }

  updateContainerWidth(): Observable<number> {
    this.pleaseWait = true;

    return timer(300)
    .pipe(
      map(() => {
        this.containerWidth = this.pleaseWaitDiv?.nativeElement?.offsetWidth - 60 || 400;
        return this.containerWidth;
      })
    );
  }

  drop(event: CdkDragDrop<Item[]>) {
    moveItemInArray(this.dashboard.items, event.previousIndex, event.currentIndex);
    // this.saveTimelineData();
  }

  openSettings(chart?: Item, arrIdx?: number) {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '70vw',
      minWidth: '400px',
      data: {chartItem: JSON.parse(JSON.stringify(chart)), arrIdx}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (arrIdx >= 0) {
          this.dashboard.items[result.arrIdx] = result.chartItem;
        } else {
          this.dashboard.items.push(result.chartItem);
        }
        this.updateChartAndThenRefreshAll(result.chartItem);
      }
    });
  }

  openEditTitleDialog() {
    const dialogRef = this.dialog.open(TitleEditDialogComponent, {
      width: '80vw',
      data: this.dashboard.title
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dashboard.title = result;
      }
    });
  }

  remove(chart: Item) {
    const idx = this.dashboard.items.indexOf(chart);
    if (idx > -1) {
      this.dashboard.items.splice(idx, 1);
    }
  }

  add(chartType: 'markdown' | 'multiline') {
    if (chartType === 'markdown') {
      this.dashboard.items.push({
        type: 'markdown',
        text: `# New _Markdown_ text block`
      } as MarkdownItem);
    }

    if (chartType === 'multiline') {
      this.openSettings({
        type: 'multiline',
        dataRequest: [],
        config: this.configService.getDefaultChartConfig('multiline')
      } as MultiLineChartItem, -1);
    }

  }

  updateChartsShallow(items: Item[]) {
    this.updateContainerWidth()
    .subscribe(containerWidth => {
      this.chartService.updateChartsShallow(items, containerWidth);
      this.pleaseWait = false;
    });
  }

  updateChartAndThenRefreshAll(d: Item) {
    this.updateContainerWidth()
    .subscribe(containerWidth => {
      this.chartService.updateChartFull(d)
      .subscribe(() => {
        this.chartService.updateChartsShallow(this.dashboard.items, containerWidth);
        this.pleaseWait = false;
      });
    });
  }
}

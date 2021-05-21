/* eslint-disable @typescript-eslint/no-misused-new */
import { Clipboard as Clp } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { from, Observable, timer } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { Dashboard } from 'src/app/repositories/types/in/dashboard';
import { ChartService, Item, MarkdownItem, MultiLineChartItem } from 'src/app/services/chart.service';
import { ConfigService } from 'src/app/services/config.service';
import { DashboardService } from 'src/app/services/dashboard.service';
import { VegaDashboardHistoryService } from 'src/app/services/vega-dashboard-history.service';
import { SettingsComponent } from '../settings/settings.component';
import { TitleEditDialogComponent } from '../title-edit-dialog/title-edit-dialog.component';

interface Clipboard {
  read(): Promise<ClipboardItem[]>;
  write(data: ClipboardItem[]): Promise<void>;
}

type ClipboardItemDelayedCallback = () => Promise<string | Blob>;

declare class ClipboardItem {
  constructor(items: Record<string, any>, options?: ClipboardItemOptions);
  static createDelayed(items: Record<string, any>, options?: ClipboardItemOptions): ClipboardItem;

  readonly presentationStyle: PresentationStyle;
  readonly lastModified: number;
  readonly delayed: boolean;
  readonly types: readonly string[];

  getType(type: string): Promise<Blob>;
}

type PresentationStyle = 'unspecified' | 'inline' | 'attachment';

interface ClipboardItemOptions {
  presentationStyle?: PresentationStyle;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  @ViewChild('pleaseWait', {static: false})
  pleaseWaitDiv: ElementRef<HTMLDivElement>;

  @ViewChildren('dashboardChart')
  dashboardCharts: QueryList<ElementRef<HTMLDivElement>>;

  @ViewChild('i18nPictureCopiedToClipboard', {static: true})
  i18nPictureCopiedToClipboard: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nPictureCopiedToClipboardButton', {static: true})
  i18nPictureCopiedToClipboardButton: ElementRef<HTMLSpanElement>;

  pleaseWait = false;

  dashboard: Dashboard;
  titleEditMode = false;

  private containerWidth: number;

  historySpec: any;

  expandVersionHistory = true;

  constructor(
    private dialog: MatDialog,
    private chartService: ChartService,
    private configService: ConfigService,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private router: Router,
    private clipboard: Clp,
    private snackBar: MatSnackBar,
    private vegaDashboardHistoryService: VegaDashboardHistoryService
  ) { }

  ngOnInit(): void {

    this.route.data.subscribe((data: {dashboard: Dashboard}) => {
      this.dashboard = data.dashboard;
      this.chartService.resetExtents();
      this.updateContainerWidth()
        .subscribe(containerWidth => {
          from(this.dashboard.items)
            .pipe(
              mergeMap(d => this.chartService.updateChartFull(d)),
              toArray()
            )
            .subscribe(items => {
              this.chartService.updateChartsShallow(items, containerWidth);

              this.updateHistoryChart(containerWidth);

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
        this.containerWidth = this.pleaseWaitDiv?.nativeElement?.offsetWidth - 140 || 400;
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

  save() {
    this.dashboardService.save(this.dashboard)
    .subscribe(ds => {
      this.router.navigate(['overview', 'dashboard', ds.id]);
    });
  }

  upvote() {
    this.dashboardService.upvote(this.dashboard)
    .subscribe(ds => {
      this.dashboard.upvotes = ds.upvotes;
    });
  }

  copyUrl() {
    this.clipboard.copy(window.location.href);
    this.snackBar.open('URL successfully copied to clipboard', 'OK', {
      duration: 2000,
      verticalPosition: 'top'
    });
  }

  downloadData(item: Item): void {
    this.chartService.downloadDataAsCsv(item);
  }

  updateHistoryChart(width: number) {
    this.dashboardService.getHistory(this.dashboard.id)
    .pipe(
      map(d => this.vegaDashboardHistoryService.compileChart(d, width, 100))
    )
    .subscribe(spec => {
      this.historySpec = spec;
      setTimeout(() => this.expandVersionHistory = false, 2000);
    });
  }

  navigateToDashboard(dashboard: Dashboard) {
    this.router.navigate(['overview', 'dashboard', dashboard.id]);
  }

  openVideo(): void {
    window.open('https://www.youtube.com/watch?v=I1ORQd9W9Ok', '_blank');
  }

  screenshot(idx: number): void {
    html2canvas(this.dashboardCharts.get(idx).nativeElement)
    .then(canvas => {
      try {
        canvas.toBlob((blb) => {
          try {
            (navigator.clipboard as unknown as any).write([new ClipboardItem({'image/png': blb})]);

            const ref = this.snackBar.open(
              this.i18nPictureCopiedToClipboard.nativeElement.textContent,
              this.i18nPictureCopiedToClipboardButton.nativeElement.textContent,
              {
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });

            ref.onAction().subscribe(() => {
              this.saveAs(canvas.toDataURL(), 'coronavis-screenshot.png');
            });
          } catch (e1) {
            console.log(e1);
            this.saveAs(canvas.toDataURL(), 'coronavis-screenshot.png');
          }
        });
      } catch (e) {
        console.error(e);
        this.saveAs(canvas.toDataURL(), 'coronavis-screenshot.png');
      }
    })
    .catch(e => {
      console.error(e);
    });
  }

  saveAs(uri: string, filename: string) {
    const link = document.createElement('a');
    if (typeof link.download === 'string') {
      link.href = uri;
      link.download = filename;

      //Firefox requires the link to be in the body
      document.body.appendChild(link);

      //simulate click
      link.click();

      //remove the link when done
      document.body.removeChild(link);
    } else {
      window.open(uri);
    }
  }


}

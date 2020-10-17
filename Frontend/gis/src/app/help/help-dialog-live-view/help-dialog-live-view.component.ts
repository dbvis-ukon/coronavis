import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help-dialog-live-view',
  templateUrl: './help-dialog-live-view.component.html',
  styleUrls: ['./help-dialog-live-view.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogLiveViewComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help-dialog-beds',
  templateUrl: './help-dialog-beds.component.html',
  styleUrls: ['./help-dialog-beds.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogBedsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

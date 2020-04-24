import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-help-dialog-cases',
  templateUrl: './help-dialog-cases.component.html',
  styleUrls: ['./help-dialog-cases.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogCasesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

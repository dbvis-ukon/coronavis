import { Component, OnInit } from '@angular/core';
import { UrlHandlerService } from '../services/url-handler.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.less']
})
export class OverviewComponent implements OnInit {

  constructor(
    public urlHandler: UrlHandlerService
  ) { }

  ngOnInit(): void {
    
  }

}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { I18nService, SupportedLocales } from 'src/app/services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.less']
})
export class LanguageSwitcherComponent implements OnInit {

  supportedLocales: string[];

  selectedLocale$: Observable<SupportedLocales>;

  constructor(
    private i18nService: I18nService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.supportedLocales = this.i18nService.getSupportedLocales();

    this.selectedLocale$ = this.i18nService.currentLocale();
  }

  changeLocale(evt) {
    this.i18nService.updateLocale(evt.value);

    const url = evt.value.slice(0, 2);

    location.href = `/${url}${this.router.url}`;
  }

}

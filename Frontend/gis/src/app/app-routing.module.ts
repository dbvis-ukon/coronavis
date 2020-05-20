import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ImpressumComponent } from './impressum/impressum.component';
import { MapRootComponent } from './map-root/map-root.component';
import { OverviewComponent } from './overview/overview.component';

const routes: Routes = [
  {
    path: 'overview',
    component: OverviewComponent
  },
  { // for share url
    path: 'map',
    component: MapRootComponent
  },
  {
    path: 'imprint',
    component: ImpressumComponent
  },
  {
    path: 'lockdown',
    component: MapRootComponent
  },
  {
    path: '',
    component: OverviewComponent,
  },
  { // default to MapRootComponent, don't throw 404
    path: '**',
    component: OverviewComponent
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, {enableTracing: environment.env === 'review' || environment.env === 'development'})
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }

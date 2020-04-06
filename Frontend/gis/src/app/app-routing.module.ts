import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ImpressumComponent } from './impressum/impressum.component';
import { MapRootComponent } from './map-root/map-root.component';

const routes: Routes = [
  {
    path: 'map',
    component: MapRootComponent
  },
  {
    path: 'imprint',
    component: ImpressumComponent
  },
  {
    path: '',
    component: MapRootComponent,
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

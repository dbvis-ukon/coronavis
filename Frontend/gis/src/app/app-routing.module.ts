import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapRootComponent } from './map-root/map-root.component';
import { ImpressumComponent } from './impressum/impressum.component';

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
    RouterModule.forRoot(routes, {enableTracing: true})
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }

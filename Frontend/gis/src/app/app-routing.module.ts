import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapRootComponent } from './map-root/map-root.component';

const routes: Routes = [
  {
    path: 'map',
    component: MapRootComponent
  },
  {
    path: '',
    component: MapRootComponent,
  }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }

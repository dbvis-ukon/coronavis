import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapRootComponent } from '../map-root/map-root.component';
import { OverviewBedComponent } from './overview-bed/overview-bed.component';
import { OverviewCaseComponent } from './overview-case/overview-case.component';
import { OverviewIntroductionComponent } from './overview-introduction/overview-introduction.component';
import { OverviewComponent } from './overview.component';

const routes: Routes = [
    {
        path: 'overview',
        component: OverviewComponent,
        children: [
            {
                path: '',
                component: OverviewIntroductionComponent
            },
            {
                path: 'beds',
                component: OverviewBedComponent
            },
            {
                path: 'cases',
                component: OverviewCaseComponent
            },
            {
                path: 'map/:flavor',
                component: MapRootComponent,
                pathMatch: 'prefix'
            }
        ]
    }
];


@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class OverviewRoutingModule { }

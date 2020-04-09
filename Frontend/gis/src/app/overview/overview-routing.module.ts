import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverviewBedComponent } from './overview-bed/overview-bed.component';
import { OverviewCaseComponent } from './overview-case/overview-case.component';
import { OverviewComponent } from './overview.component';

const routes: Routes = [
    {
        path: 'overview',
        component: OverviewComponent,
        children: [
            {
                path: '',
                redirectTo: 'beds',
                pathMatch: 'full'
            },
            {
                path: 'beds',
                component: OverviewBedComponent
            },
            {
                path: 'cases',
                component: OverviewCaseComponent
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

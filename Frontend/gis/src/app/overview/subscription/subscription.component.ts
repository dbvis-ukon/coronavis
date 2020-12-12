import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CountyRepository } from 'src/app/repositories/county.repository';
import { EmailSubscriptionRepository } from 'src/app/repositories/email-subscription.repository';
import { County } from 'src/app/repositories/types/in/county';
import { EmailSubscription } from 'src/app/repositories/types/in/email-subscription';
import { Searchable } from 'src/app/shared/hospital-search/hospital-search.component';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.less']
})
export class SubscriptionComponent implements OnInit {

  @ViewChild('lsuccess', { static: true })
  lsuccess: ElementRef<HTMLSpanElement>;

  @ViewChild('lunsubsuccess', { static: true })
  lunsubsuccess: ElementRef<HTMLSpanElement>;

  @ViewChild('lsubverifysuccess', { static: true })
  lsubverifysuccess: ElementRef<HTMLSpanElement>;

  @ViewChild('lsubupdatesuccess', { static: true })
  lsubupdatesuccess: ElementRef<HTMLSpanElement>;

  matcher = new MyErrorStateMatcher();

  checkoutForm: FormGroup;

  counties$: Observable<Searchable[]>;

  selectedCounty: FormControl;

  resetSearch: number;

  subId: number;
  subToken: string;

  success: string;
  error: string;

  verifyMode = false;

  constructor(
    private emailRepo: EmailSubscriptionRepository,
    private formBuilder: FormBuilder,
    private countyRepo: CountyRepository,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.selectedCounty = this.formBuilder.control('');

    this.checkoutForm = this.formBuilder.group({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      lang: 'de',
      counties: this.formBuilder.array([], Validators.required),
      terms: new FormControl(false, [Validators.requiredTrue]),
      terms2: new FormControl(false, [Validators.requiredTrue])
    });
  }

  ngOnInit(): void {
    this.counties$ = this.countyRepo.get().pipe(map(d => d.sort((a, b) => a.name.localeCompare(b.name)).map(d1 => ({
        name: d1.name,
        addition: d1.desc,
        desc: d1.desc,
        ags: d1.ags,
      } as Searchable))));

    this.route.queryParams.subscribe(p => {
      if (p.success) {
        this.success = this.lunsubsuccess.nativeElement.textContent;
      }
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        const token = params.get('token');

        if (id > 0) {
          this.subId = id;
          this.subToken = token;

          console.log('PARAMS', params);

          this.verifyMode = params.get('verify') === 'verify';
          return this.emailRepo.get(id, token);
        }

        return of(undefined);
      })
    )
    .subscribe(sub => {
      if (!sub) {
        return;
      }

      this.checkoutForm.get('email').setValue(sub.email);
      this.checkoutForm.get('email').disable();
      this.checkoutForm.get('lang').setValue(sub.lang);
      this.checkoutForm.get('terms').setValue(true);
      this.checkoutForm.get('terms2').setValue(true);

      sub.counties.forEach(c => {
        this.addCounty({
          ags: c.ags,
          name: c.county.name,
          desc: c.county.desc
        });
      });


      if (this.verifyMode) {
        const customerData = this.checkoutForm.value;
        customerData.verified = true;
        this.emailRepo.update(this.subId, this.subToken, customerData)
        .subscribe(
          () => this.success = this.lsubverifysuccess.nativeElement.textContent,
          (err: HttpErrorResponse) => this.error = `${err?.error?.name}: ${err?.error?.description}`
        );
      }

    },
    (err: HttpErrorResponse) => {
      this.error = `${err?.error?.name}: ${err?.error?.description}`;
      console.error(err);
    });
  }

  onSubmit(customerData: EmailSubscription) {
    console.warn('submitted', customerData);

    if (this.subId > 0) {
      customerData.verified = true;
      this.emailRepo.update(this.subId, this.subToken, customerData)
      .subscribe(
        () => this.success = this.lsubupdatesuccess.nativeElement.textContent,
        (err: HttpErrorResponse) => this.error = `${err?.error?.name}: ${err?.error?.description}`
      );
    } else {
      this.emailRepo.subscribe(customerData)
      .subscribe(
        () => this.success = this.lsuccess.nativeElement.textContent,
        (err: HttpErrorResponse) => this.error = `${err?.error?.name}: ${err?.error?.description}`
      );
    }
  }

  get counties() {
    return this.checkoutForm.get('counties') as FormArray;
  }

  addCounty(c: County) {
    if (this.counties.controls.find(cntrl => cntrl.get('ags').value === c.ags)) {
      this.resetSearch = Math.random();
      return false;
    }

    this.counties.push(this.formBuilder.group({
      ags: c.ags,
      desc: c.desc,
      name: c.name
    }));

    this.resetSearch = Math.random();
  }

  deleteCounty(idx) {
    this.counties.removeAt(idx);
  }

  unsubscribe() {
    this.emailRepo.unsubscribe(this.subId, this.subToken)
    .subscribe(
      () => {
        this.router.navigate(['/overview/subscription'], { queryParams: {success: true}});
      },
      (err: HttpErrorResponse) => this.error = `${err?.error?.name}: ${err?.error?.description}`
    );
  }

}

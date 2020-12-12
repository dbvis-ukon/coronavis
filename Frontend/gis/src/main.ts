import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { TouchHack } from './app/util/touch-hack';
import { environment } from './environments/environment';


// eslint-disable-next-line @typescript-eslint/no-unused-expressions
new TouchHack(document);

if (environment.env === 'production') {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

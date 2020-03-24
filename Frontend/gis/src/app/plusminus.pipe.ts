import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'plusminus'
})
export class PlusminusPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    return `${value > 0 ? '+' : ''}${value}`;
  }

}

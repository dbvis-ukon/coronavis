import { ElementRef } from '@angular/core';

export declare class ResizedEvent {
    readonly element: ElementRef;
    readonly newWidth: number;
    readonly newHeight: number;
    readonly oldWidth: number;
    readonly oldHeight: number;
    constructor(element: ElementRef, newWidth: number, newHeight: number, oldWidth: number, oldHeight: number);
}

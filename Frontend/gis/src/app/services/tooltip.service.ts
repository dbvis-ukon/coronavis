import { ConnectedPosition, FlexibleConnectedPositionStrategyOrigin, GlobalPositionStrategy, Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ComponentRef, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TooltipService {

  private overlayRef: OverlayRef;
  private tooltipRef: ComponentRef<any>;
  private onCloseAction: () => void | null;

  constructor(private overlay: Overlay,
              private overlayPositionBuilder: OverlayPositionBuilder) {
    this.overlayRef = this.overlay.create({
      scrollStrategy: this.overlay.scrollStrategies.block()
    });
  }

  openAtMousePosition<T>(tooltipComponent: ComponentType<T>, mouse: MouseEvent): T {
    const pos: GlobalPositionStrategy = this.overlayPositionBuilder.global()
      .left(mouse.clientX + 'px')
      .top(mouse.clientY + 'px');

    this.overlayRef.updatePositionStrategy(pos);


    if (!this.tooltipRef) {
      this.tooltipRef = this.overlayRef.attach(new ComponentPortal(tooltipComponent));
    }

    this.overlayRef.updatePosition();

    return this.tooltipRef.instance;
  }

  openAtElementRef<T>(
    tooltipComponent: ComponentType<T>,
    elementRef: FlexibleConnectedPositionStrategyOrigin,
	  onCloseAction: () =>  void | null = null,
    positions: ConnectedPosition[] = [
      {
        overlayX: 'start',
        overlayY: 'top',
        originX: 'end',
        originY: 'bottom',
        offsetX: 5,
        offsetY: 5
      },
      {
        overlayX: 'end',
        overlayY: 'top',
        originX: 'start',
        originY: 'bottom',
        offsetX: -5,
        offsetY: 5
      },
      {
        overlayX: 'start',
        overlayY: 'bottom',
        originX: 'end',
        originY: 'top',
        offsetX: 5,
        offsetY: -5
      },
      {
        overlayX: 'end',
        overlayY: 'bottom',
        originX: 'start',
        originY: 'top',
        offsetX: -5,
        offsetY: -5
      },
    ]
  ): T {
    const pos = this.overlayPositionBuilder
    // Create position attached to the elementRef
      .flexibleConnectedTo(elementRef)
      // Describe how to connect overlay to the elementRef
      // Means, attach overlay's center bottom point to the
      // top center point of the elementRef.
      .withPositions(positions);

    this.overlayRef.updatePositionStrategy(pos);

    if (!this.tooltipRef) {
      this.tooltipRef = this.overlayRef.attach(new ComponentPortal(tooltipComponent));
    }

    this.overlayRef.updatePosition();
	
	this.onCloseAction = onCloseAction;

    return this.tooltipRef.instance;
  }

  close() {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      this.tooltipRef = null;
	  if (this.onCloseAction !== null) {
		  this.onCloseAction();
		  this.onCloseAction = null;
	  }
    }
  }
}

import { Injectable, ComponentRef } from '@angular/core';
import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
  ConnectedPosition,
  GlobalPositionStrategy, FlexibleConnectedPositionStrategyOrigin
} from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root'
})
export class TooltipService {

  private overlayRef: OverlayRef;
  private tooltipRef: ComponentRef<any>;

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
    positions: ConnectedPosition[] = [{
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
    }]
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

    return this.tooltipRef.instance;
  }

  close() {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      this.tooltipRef = null;
    }
  }
}

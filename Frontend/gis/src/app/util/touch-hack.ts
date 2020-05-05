import { timer } from 'rxjs';

/**
 * This code is taken from https://stackoverflow.com/a/49924510/1986417 and modified.
 * @author Manuel Otto, Wolfgang Jentner
 */
export class TouchHack {
  /**
   * The list of touchpoints.
   */
  private _touchpoints: {x: number, y: number}[] = [];

  /**
   * Adds the defined listeners to the document.
   * @param target the target document
   * @param toRegister the touch events to register touches (e.g., touchstart, touchend)
   * @param toHandle the mouse events to be handeled (e.g., mouseover, mousemove)
   * @param keep_ms how long to keep the touch events (ms).
   * @param kill Kill the mouse event if followed by a touch event.
   * @param epsDistance The maximum distance between a finger and the mouse cursor.
   */
  constructor(
    private readonly target: Document, 
    toRegister = ['touchstart', 'touchmove', 'touchend'], 
    toHandle = ['mouseover', 'mouseenter', 'click', 'mousemove'],
    private readonly keep_ms = 1000,
    private readonly kill = false,
    private readonly epsDistance = 5
    ) {
    this.addListeners(toRegister, toHandle);
  }

  /**
   * Add all the listeners to register touches and handle mouse events.
   */
  private addListeners(toRegister: string[], toHandle: string[]) {
    toRegister.forEach(r => this.target.addEventListener(r, (ev: TouchEvent) => this.registerTouch(ev), true));

    toHandle.forEach(h => this.target.addEventListener(h, (ev: MouseEvent) => this.handleMouseEvent(ev), true));
  }

  /**
   * Stores all pageX/pageY for every finger into a list.
   * Each item is stored for max ()
   * @param e the touch event to register
   */
  private registerTouch(e: TouchEvent) {
    const touches = e.touches || e.changedTouches;
    // console.log('registerTouch', touch, e);
    if(!touches) {
      return;
    }
    
    for(let i = 0; i < touches.length; i++) {
      const touch = touches.item(i);
      const point = {
        x: touch.pageX,
        y: touch.pageY
      }
      this._touchpoints.push(point);

      timer(this.keep_ms)
        .subscribe(() => this._touchpoints.splice(this._touchpoints.indexOf(point), 1));
    }
  }

  /**
   * Injects a triggeredByTouch flag into the mouse event if a touch event was previously registered and one of the fingers
   * was close to the position of the mouse.
   * @param e the mouse event to handle
   */
  private handleMouseEvent(e: MouseEvent) {
    for (const i in this._touchpoints) {
      //check if mouseevent's position is (almost) identical to any previously registered touch events' positions
      if (Math.abs(this._touchpoints[i].x - e.pageX) < this.epsDistance && Math.abs(this._touchpoints[i].y - e.pageY) < this.epsDistance) {
        //set flag on event
        (e as any).triggeredByTouch = true
        //if wanted, kill the event
        if (this.kill) {
          e.returnValue = false
          e.cancelBubble = true
          e.preventDefault()
          e.stopPropagation()
        }
        return
      }
    }
  }
}

export class TouchHack {
  private keep_ms = 1000; // how long to keep the touchevents
  private kill = false; // wether to kill any mouse events triggered by touch
  private touchpoints: {x: number, y: number}[] = [];

  constructor(private target: Document) {
    this.addListeners();
  }

  addListeners() {
    this.target.addEventListener('touchstart', (ev) => this.registerTouch(ev), true);
    this.target.addEventListener('touchmove', (ev) => this.registerTouch(ev), true);
    this.target.addEventListener('touchend', (ev) => this.registerTouch(ev), true);

    // which mouse events to monitor
    this.target.addEventListener('mouseover', (ev) => this.handleMouseEvent(ev), true);
    this.target.addEventListener('mouseenter', (ev) => this.handleMouseEvent(ev), true);
    this.target.addEventListener('click', (ev) => this.handleMouseEvent(ev), true);
    this.target.addEventListener('mousemove', (ev) => this.handleMouseEvent(ev), true);
  }

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
      this.touchpoints.push(point)
      setTimeout(() => {
        // remove touchpoint from list after keep_ms
        this.touchpoints.splice(this.touchpoints.indexOf(point), 1)
      }, this.keep_ms)
    }
  }

  private handleMouseEvent(e: MouseEvent) {
    for (const i in this.touchpoints) {
      //check if mouseevent's position is (almost) identical to any previously registered touch events' positions
      if (Math.abs(this.touchpoints[i].x - e.pageX) < 2 && Math.abs(this.touchpoints[i].y - e.pageY) < 2) {
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
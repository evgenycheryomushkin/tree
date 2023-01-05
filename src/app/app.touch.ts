export class AppTouch {
    protected touched: boolean = false;
    protected clientX: number = 0; 
    protected clientY: number = 0; 

    touchEvent(event: TouchEvent) {
      if (event.changedTouches.length > 0) {
        this.clientX = event.changedTouches[0].clientX
        this.clientY = event.changedTouches[0].clientY
      }
    }
  
    touchStart(event: TouchEvent) {
      this.touched = true;
      this.touchEvent(event);
    }

    touchMove(event: TouchEvent) {
      this.touchEvent(event);
    }

    touchEnd(event: TouchEvent) {
      this.touched = true;
      this.touchEvent(event);
    }
  
}
import { AppTouch } from "./app.touch";

export abstract class AppMouse extends AppTouch {
    // distance were vertix is distracted from mouse
    protected DistractionMouseDistance: number = 5;
    
    // distance from other vertices to distract
    // new vertix from them
    protected DistractionVerticesDistance: number = 5;

    // distraction force
    protected DistractionForce: number = 0.2;

    // if distance between vertix and
    // mouse is smaller then this distance
    // then grow this branch faster
    protected AttgrationDistance: number = 50;
    
    // force to attract vertix to mouse
    protected AttractionForce: number = 0.2;

    // maximum speed up of growing a branch.
    // distance to add to next vertix
    protected SpeedUpDistance: number = 2;
  
    private mouseX: number = 0;
    private mouseY: number = 0;

    abstract getBoundingClientRect(): any; //todo type

    mouseMove(event: any) {
      const rect = this.getBoundingClientRect();
      this.mouseX = event.clientX - rect.left;
      this.mouseY = event.clientY - rect.top;
    }
  
    abstract mouseDown(event: any): void; ///todo type

    getMouseX() {
      if (this.touched) {
        return this.clientX;
      } else {
        return this.mouseX;
      }
    }
  
    protected getMouseY():number {
      if (this.touched) {
        return this.clientY;
      } else {
        return this.mouseY;
      }
    }
  
}
import { AppTouch } from "./app.touch";

export abstract class AppMouse extends AppTouch {
    protected R: number = 3;
    protected Rmouse: number = 50;
    protected Amouse: number = 0.2;
    protected Dmouse: number = 5;
    protected Tmouse: number = 10;
  
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
  
    getMouseY() {
      if (this.touched) {
        return this.clientY;
      } else {
        return this.mouseY;
      }
    }
  
}
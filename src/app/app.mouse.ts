import { AppTouch } from "./app.touch";

export abstract class AppMouse extends AppTouch {

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
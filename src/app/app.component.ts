import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AppMouse } from './app.mouse';
import { Tree, TreeVertex } from '../tree/tree';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends AppMouse {
  private title = 'Tree';
  private dt: number = 0.1;

  private tree:Tree = new Tree();

  private play: boolean = true;
  private interval: any;
  pauseButtonText: string = "pause";
  shareButtonText: string = "share";
  newButtonText: string = "new";

  private MossSize: number = 3;

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement> = {} as ElementRef;  

  private ctx!: CanvasRenderingContext2D;

  ngOnInit(): void {
    const c = this.canvas.nativeElement.getContext('2d');
    
    if (null != c) 
      this.ctx = c;
    else 
      throw new Error("cant find canvas");

    this.resize();
    this.startTimer();
  }

  getBoundingClientRect() {
    return this.ctx.canvas.getBoundingClientRect();
  }

  resize() {
    this.canvas.nativeElement.width = window.innerWidth - 10;
    this.canvas.nativeElement.height = window.innerHeight - 40;
  }

  mouseDown(event: any) {
    if (this.tree.vertices.length > 0 && !this.play)
      this.drawLeaf();
  }

  pauseClick(event: any) {
    this.playPause();
  }

  newClick(event: any) {
    this.ctx.clearRect(0, 0, 
      this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.tree.reset();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event:KeyboardEvent) {
    console.log(event);
    if (event.code == 'Space') {
      this.playPause();
    }
  }

  playPause() {
    if (this.play) {
      this.pauseButtonText = "start";
      this.pauseTimer();
    } else {
      this.pauseButtonText = "pause";
      this.startTimer();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
    this.resize();
  }

  startTimer() {
    console.log("start");
    const app = this;
    this.play = true;
    this.interval = setInterval(() => {
      app.tree.tick(this.ctx.canvas.width, this.ctx.canvas.height, this.getMouseX(), this.getMouseY());
      app.draw();
    }, this.dt*1000)
  }

  pauseTimer() {
    console.log("stop");
    this.play = false;
    clearInterval(this.interval);
  }

  drawLeaf() {
    let minD: number | undefined;
    let minV: TreeVertex | undefined;
    for(let v of this.tree.vertices) {        
      const d = v.distance(this.getMouseX(), this.getMouseY()) + v.T;
      if (minD == undefined || minD > d) {
        minD = d;
        minV = v;
      }
    }
    if (minV != undefined) {
      minV.leaf = true;
      const v = minV;
      if (v.leaf && v.prev) {
        const dx = (v.y - v.prev.y);
        const dy = (v.x - v.prev.x);
        const n = Math.sqrt(dx*dx + dy*dy);

        const lx = v.x + Math.sqrt(v.T) * dx/n;
        const ly = v.y + Math.sqrt(v.T) * dy/n;
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, this.MossSize, 0, 2 * Math.PI, false)
        this.ctx.fillStyle = 'green';
        this.ctx.fill();
      }
    }
  }

  draw() {
    for(let v of this.tree.vertices) {
      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, Math.sqrt(v.T), 0, 2 * Math.PI, false)
      this.ctx.fillStyle = 'brown';
      this.ctx.fill();
    }
  }
}

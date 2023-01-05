import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AppMouse } from './app.mouse';

var nextId: number = 1;

export class TreeVertex {
  id: number;
  T: number;
  x: number;
  y: number;
  prev: TreeVertex | undefined;
  leaf: boolean = false;
  leafMult = 1;

  constructor(x: number, y: number, T: number, prev: TreeVertex | undefined) {
    this.id = nextId++;
    this.x = x;
    this.y = y;
    this.T = T;
    this.prev = prev;
    if (Math.random()<0.5) this.leafMult = -1;
  }
  distance2(last: TreeVertex): number {
    const dx = this.x-last.x;
    const dy = this.y-last.y;
    return dx*dx + dy*dy;
  }
  distance(x: number, y: number) {
    const dx = this.x-x;
    const dy = this.y-y;
    return Math.sqrt(dx*dx + dy*dy);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends AppMouse {
  private title = 'Tree';
  private time: number = 0;

  private dt: number = 0.1;
  private dy: number = 1;

  private dT: number = 0.5;
  private lT: number = 3;
  private T0: number = 1;

  private df: number = 0.01;

  private play: boolean = true;
  private interval: any;
  pauseButtonText: string = "pause";
  shareButtonText: string = "share";
  newButtonText: string = "new";

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement> = {} as ElementRef;  

  private ctx!: CanvasRenderingContext2D;
  private vertices = new Array<TreeVertex>();
  private iteration:number = 1;

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
    if (this.vertices.length > 0 && !this.play)
      this.drawLeaf();
  }

  pauseClick(event: any) {
    this.playPause();
  }

  newClick(event: any) {
    this.ctx.clearRect(0, 0, 
      this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.vertices = new Array<TreeVertex>();
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
      app.iteration ++;
      app.time+=app.dt;
      app.grow();
      app.draw();
      if (app.iteration % 100 == 0)
        app.removeUnnecessary();
    }, this.dt*1000)
  }

  pauseTimer() {
    console.log("stop");
    this.play = false;
    clearInterval(this.interval);
  }

  growIndex = 0;
  grow() {
    this.growIndex ++;
    // add new vertex as branch
    if (this.vertices.length == 0) {
      let x = this.ctx.canvas.width / 2;
      let y = this.ctx.canvas.height;
      this.vertices.push(new TreeVertex(x, y, this.T0, undefined));
    } else {
      let minD: number | undefined;
      let minV: TreeVertex | undefined;
      for(let v of this.vertices) {        
        const d = v.distance(this.getMouseX(), this.getMouseY()) - Math.sqrt(v.T);
        if (minD == undefined || minD > d) {
          minD = d;
          minV = v;
        }
      }
      if (minV != undefined) {
        let [x,y] = this.calculateNewVertexPos(minV, 90);
        this.vertices.push(new TreeVertex(x, y, this.T0, minV));
        
        while(minV != undefined) {
          minV.T += this.dT;
          minV = minV.prev;
        }    
      }
    }
  }

  calculateNewVertexPos(last: TreeVertex, angle: number): [number, number] {
    const near = new Array<TreeVertex>();
    for(let v of this.vertices) {
      if (v.distance2(last) < this.R) near.push(v);
    }
    let radius = Math.sqrt(last.T);
    let mult = 1;
    if (Math.random() < 0.5) mult = -1;
    // todo add mouse here
    let x = last.x + mult * Math.cos(angle)*radius;
    let y = last.y - Math.sin(angle)*radius;

    const d = this.distance(x, y, this.getMouseX(), this.getMouseY());
    if (d < this.Rmouse) {
      const force = this.Amouse * (1 - d/this.Rmouse);
      x += force * (this.getMouseX() - x);
      y += force * (this.getMouseY() - y);
    }

    if (d < this.Dmouse) {
      const v = new TreeVertex(this.getMouseX(), this.getMouseY(), this.Tmouse, undefined);
      near.push(v);
    }

    for(const v of near) {
      x += this.df * (x - v.x) * Math.sqrt(v.T);
      y += this.df * (y - v.y) * Math.sqrt(v.T);
    }

    return [x,y];
  }

  distance(x: number, y: number, mouseX: number, mouseY: number): number {
    const dx = mouseX-x;
    const dy = mouseY-y;
    return Math.sqrt(dx*dx + dy*dy);    
  }

  drawLeaf() {
    let minD: number | undefined;
    let minV: TreeVertex | undefined;
    for(let v of this.vertices) {        
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
        const dx = v.leafMult * (v.y - v.prev.y);
        const dy = v.leafMult * (v.x - v.prev.x);
        const n = Math.sqrt(dx*dx + dy*dy);

        const lx = v.x + Math.sqrt(v.T) * dx/n;
        const ly = v.y + Math.sqrt(v.T) * dy/n;
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, this.lT, 0, 2 * Math.PI, false)
        this.ctx.fillStyle = 'green';
        this.ctx.fill();
      }
    }
  }

  draw() {
    for(let v of this.vertices) {
      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, Math.sqrt(v.T), 0, 2 * Math.PI, false)
      this.ctx.fillStyle = 'brown';
      this.ctx.fill();
    }
  }

  removeUnnecessary() {
    const visited =   new Set<number>();
    const remove = new Set<number>();
    for(let v of this.vertices) {
      if (!visited.has(v.id)) {
        if (v.prev != undefined && !visited.has(v.id)) {
          const p = v.prev;
          if (p.prev != undefined && !visited.has(p.id)) {
            const p2 = p.prev;
            visited.add(v.id);
            const d12 = Math.sqrt(v.distance2(p));
            const d23 = Math.sqrt(p.distance2(p2));
            const d13 = Math.sqrt(v.distance2(p2));
            const R1 = Math.sqrt(v.T);
            const R3 = Math.sqrt(p2.T);
            if (1.5 * d13 > d12 + d23) {
              if (d13 * 4 < R1 && d13 * 4 < R3) {
                remove.add(p.id);
                v.prev = p2;
              }
            }
          }
        }
      }
    }
    const newVertices = new Array<TreeVertex>();
    for(let v of this.vertices) {
      if (!remove.has(v.id)) newVertices.push(v);
    }
    this.vertices = newVertices;
    console.log("Filtered:", remove.size);
  }
}

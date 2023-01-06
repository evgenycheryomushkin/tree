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
  // initial thickness of tree vertix
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
    // if there are no vertices then
    // add on verix as root
    if (this.vertices.length == 0) {
      let x = this.ctx.canvas.width / 2;
      let y = this.ctx.canvas.height;
      this.vertices.push(new TreeVertex(x, y, this.T0, undefined));
    } else {
      // find nearest vertix
      let minD: number | undefined;
      let minV: TreeVertex | undefined;
      for(let v of this.vertices) {        
        const d = v.distance(this.getMouseX(), this.getMouseY()) - Math.sqrt(v.T);
        if (minD == undefined || minD > d) {
          minD = d;
          minV = v;
        }
      }

      if (minV == undefined) throw Error("wrong work of vertices array");
      this.vertices.push(this.calculateNewVertix(minV));
        
        while(minV != undefined) {
          minV.T += this.dT;
          minV = minV.prev;
        }    
      
    }
  }

  // calculate point on circle and add dd distance
  // to make point a little farther away
  calculateCirclePoint(closest: TreeVertex, dd:number = 0) {
    const mouseX = this.getMouseX();
    const mouseY = this.getMouseY();
    const dx = mouseX - closest.x;
    const dy = mouseY - closest.y;
    const d = this.distance(closest.x, closest.y, this.getMouseX(), this.getMouseY());
    const R = Math.sqrt(closest.T);
    return [closest.x+dx/d*(R+dd), closest.y+dy/d*(R+dd)];
  }

  calculateNewVertix(closest: TreeVertex): TreeVertex {
    let [xn,yn] = this.calculateCirclePoint(closest);

    // distance between point on circle
    // and mouse pointer
    const d2 = this.distance(xn, yn, this.getMouseX(), this.getMouseY());

    var f1: number = 0;

    var forceX: number = 0;
    var forceY: number = 0;

    if (d2 < this.AttgrationDistance) {
      // mouse is near enough to speed up growing a branch
      // distance to add to point to grow
      f1 = this.AttractionForce * (1 - d2 / this.AttgrationDistance);
      forceX = (this.getMouseX() - xn) / d2 * f1;
      forceY = (this.getMouseY() - yn) / d2 * f1;
    }

    var fi: number = 0;
    if (d2 < this.DistractionMouseDistance) {
      forceX += (xn - this.getMouseX()) / d2 * this.DistractionForce;
      forceY += (yn - this.getMouseY()) / d2 * this.DistractionForce;
    }

    for(let v of this.vertices) {
      const d = v.distance(xn, yn);
      if (d < this.DistractionVerticesDistance) {
        forceX += (xn - v.x) / d * this.DistractionForce;
        forceY += (yn - v.y) / d * this.DistractionForce;  
      }
    }

    xn += forceX;
    yn += forceY;

    return new TreeVertex(xn, yn, this.T0, closest);
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

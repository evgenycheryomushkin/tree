import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AppMouse } from './app.mouse';
import { Tree, TreeVertex } from '../tree/tree';
import { AboutComponent } from './about/about.component';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends AppMouse {
  private title = 'Tree';
  private dt: number = 0.1;

  private tree: Tree = new Tree();

  private play: boolean = true;
  private interval: any;
  pauseButtonText: string = "pause";
  shareButtonText: string = "share";
  newButtonText: string = "new";
  downloadButtonText: string = "download";
  aboutButtonText: string = "about";
  aboutClicked: boolean = false;

  private LeafThicknessCoefficient: number = 10;

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement> = {} as ElementRef;

  @ViewChild('about', { static: true })
  about: AboutComponent;


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


  private growLeaf = async (x0: number, y0: number, xm: number, ym: number, size: number) => {
    var alpha = 0;
    while (alpha < 0.1) {
      await sleep(100);
      alpha += 0.01;
      this.oneLeaf(x0, y0, xm, ym, size, alpha);
    }
  }

  getBoundingClientRect() {
    return this.ctx.canvas.getBoundingClientRect();
  }

  resize() {
    this.canvas.nativeElement.width = window.innerWidth - 40;
    this.canvas.nativeElement.height = window.innerHeight - 100;
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
  onKeyDown(event: KeyboardEvent) {
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
  onResize(event: any) {
    this.resize();
  }

  startTimer() {
    console.log("start");
    const app = this;
    this.play = true;
    this.interval = setInterval(() => {
      app.tree.tick(this.ctx.canvas.width, this.ctx.canvas.height, this.getMouseX(), this.getMouseY());
      app.draw();
    }, this.dt * 1000)
  }

  pauseTimer() {
    console.log("stop");
    this.play = false;
    clearInterval(this.interval);
  }

  downloadClick(event: any) {
    var canvasDataUrl = this.canvas.nativeElement.toDataURL()
      .replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
    var link = document.createElement('a'); // create an anchor tag

    // set parameters for downloading
    link.setAttribute('href', canvasDataUrl);
    link.setAttribute('target', '_blank');
    link.setAttribute('download', "tree.png");

    // compat mode for dispatching click on your anchor
    if (document.createEvent) {
      var evtObj = document.createEvent('MouseEvents');
      evtObj.initEvent('click', true, true);
      link.dispatchEvent(evtObj);
    } else if (link.click) {
      link.click();
    }
    this.resize();
  }

  aboutClick(event: any) {
    this.aboutClicked = !this.aboutClicked;
  }

  drawLeaf() {
    let minD: number | undefined;
    let minV: TreeVertex | undefined;
    for (let v of this.tree.vertices) {
      const d = v.distance(this.getMouseX(), this.getMouseY());
      if (minD == undefined || minD > d) {
        minD = d;
        minV = v;
      }
    }
    if (minV != undefined) {
      const [x, y] = this.tree.calculateCirclePoint(minV, this.getMouseX(), this.getMouseY());
      (async () => await this.growLeaf(x, y, this.getMouseX(), this.getMouseY(), 10))();
    }
  }

  draw() {
    for (let v of this.tree.vertices) {
      this.ctx.beginPath();
      this.ctx.arc(v.x, v.y, Math.sqrt(v.T), 0, 2 * Math.PI, false)
      this.ctx.fillStyle = 'brown';
      this.ctx.fill();
    }
  }



  oneLeaf(x0: number, y0: number, xm: number, ym: number, size: number, fade: number) {
    const R = size;
    const dx1 = (xm - x0);
    const dy1 = (ym - y0);
    const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const dx = dx1 / d1;
    const dy = dy1 / d1;

    const xA = x0 + 3 * R / 4 * dx;
    const yA = y0 + 3 * R / 4 * dy;
    const xB = xA + 1 / this.LeafThicknessCoefficient * Math.sqrt(3) / 2 * R * dy;
    const yB = yA - 1 / this.LeafThicknessCoefficient * Math.sqrt(3) / 2 * R * dx;
    const xC = xA - 1 / this.LeafThicknessCoefficient * Math.sqrt(3) / 2 * R * dy;
    const yC = yA + 1 / this.LeafThicknessCoefficient * Math.sqrt(3) / 2 * R * dx;

    const xO1 = x0 + 1 / 4 * dx * R;
    const yO1 = y0 + 1 / 4 * dy * R;
    const xO2 = x0 + 5 / 4 * dx * R;
    const yO2 = y0 + 5 / 4 * dy * R;

    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x0 + dx * 5 * R / 4, y0 + dy * 5 * R / 4);
    this.ctx.strokeStyle = 'rgba(0, 100, 0, ' + fade * 2 + ')';
    this.ctx.stroke();

    const R1 = Math.sqrt((xB - xO1) * (xB - xO1) + (yB - yO1) * (yB - yO1));

    const startAngle1 = Math.atan2(yO1 - yB, xO1 - xB);
    const endAngle1 = Math.atan2(yO2 - yB, xO2 - xB);

    this.ctx.beginPath();
    this.ctx.arc(xB, yB, R1, startAngle1, endAngle1, true);

    const startAngle2 = Math.atan2(yO1 - yC, xO1 - xC);
    const endAngle2 = Math.atan2(yO2 - yC, xO2 - xC);

    this.ctx.arc(xC, yC, R1, startAngle2, endAngle2, false);
    this.ctx.strokeStyle = 'rgba(0, 100, 0, ' + fade * 2 + ')';
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(0, 100, 0, ' + fade + ')';
    this.ctx.fill();

    const xO3 = x0 + 2 / 4 * dx * R;
    const yO3 = y0 + 2 / 4 * dy * R;
    const xO4 = x0 + 4 / 4 * dx * R;
    const yO4 = y0 + 4 / 4 * dy * R;

    const alpha = Math.atan2(dy, dx);
    const a45 = alpha + Math.PI / 4;
    const a_45 = alpha - Math.PI / 4;

    this.ctx.beginPath();
    this.ctx.moveTo(xO3, yO3);
    this.ctx.lineTo(xO3 + Math.cos(a45) * R * this.LeafThicknessCoefficient / 50,
      yO3 + Math.sin(a45) * R * this.LeafThicknessCoefficient / 50);
    this.ctx.moveTo(xO3, yO3);
    this.ctx.lineTo(xO3 + Math.cos(a_45) * R * this.LeafThicknessCoefficient / 50,
      yO3 + Math.sin(a_45) * R * this.LeafThicknessCoefficient / 50);
    this.ctx.moveTo(xA, yA);
    this.ctx.lineTo(xA + Math.cos(a45) * R * this.LeafThicknessCoefficient / 50,
      yA + Math.sin(a45) * R * this.LeafThicknessCoefficient / 50);
    this.ctx.moveTo(xA, yA);
    this.ctx.lineTo(xA + Math.cos(a_45) * R * this.LeafThicknessCoefficient / 50,
      yA + Math.sin(a_45) * R * this.LeafThicknessCoefficient / 50);
    this.ctx.moveTo(xO4, yO4);
    this.ctx.lineTo(xO4 + Math.cos(a45) * R * this.LeafThicknessCoefficient / 100,
      yO4 + Math.sin(a45) * R * this.LeafThicknessCoefficient / 100);
    this.ctx.moveTo(xO4, yO4);
    this.ctx.lineTo(xO4 + Math.cos(a_45) * R * this.LeafThicknessCoefficient / 100,
      yO4 + Math.sin(a_45) * R * this.LeafThicknessCoefficient / 100);
    this.ctx.strokeStyle = 'rgba(0, 100, 0, ' + fade * 2 + ')';
    this.ctx.stroke();
  }
}

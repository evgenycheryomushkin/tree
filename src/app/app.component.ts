import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AppMouse } from './app.mouse';
import { Tree, TreeVertex } from '../tree/tree';
import { Leaf } from 'src/leaf/leaf';
import { AudioService } from './audio.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

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
  private time: number = 0;
  private dt: number = 0.025;

  private tree: Tree = new Tree();
  private leaves: Array<Leaf> = new Array<Leaf>();

  private play: boolean = true;
  private playBeforeAbout: boolean;
  private interval: any;
  pauseButtonText: string = "pause";
  shareButtonText: string = "share";
  newButtonText: string = "new";
  downloadButtonText: string = "download";
  aboutButtonText: string = "settings";
  doneButtonText: string = "done";


  aboutClicked: boolean = false;

  private LeafThicknessCoefficient: number = 10;
  private LeafSize: number = 10;

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement> = {} as ElementRef;

  private ctx!: CanvasRenderingContext2D;

  constructor(private audioService: AudioService) {
    super();
    audioService.init();
  }

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
    console.log("resize:", this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.redraw();
  }

  mouseDown(event: any) {
    if (this.tree.vertices.length > 0 && !this.play)
      this.drawLeaf();
  }

  clearRect() {
    this.ctx.clearRect(0, 0,
      this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  newClick(event: any) {
    this.leaves = new Array<Leaf>();
    this.tree.reset();
    this.redraw();
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

  getCW() {
    return this.canvas.nativeElement.width;
  }

  getCH() {
    return this.canvas.nativeElement.height;
  }

  override getMouseX(): number {
    return super.getMouseX() - this.getCW() / 2;
  }

  protected override getMouseY(): number {
    return super.getMouseY() - this.getCH();
  }

  startTimer() {
    console.log("start");
    const app = this;
    this.play = true;
    this.interval = setInterval(() => {
      app.tree.tick(this.time, this.getMouseX(), this.getMouseY());
      app.draw();
      if (this.tree.iteration % 1000 == 0) {
        console.log("redraw leaves");
        this.clearRect();
        this.drawLeaves();
      }
      this.time += this.dt;
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

  pauseClick(event: any) {
    this.playPause();
  }


  prevWidth: number;
  prevHeight: number;

  aboutClick(event: any) {
    this.prevWidth = this.canvas.nativeElement.width;
    this.prevHeight = this.canvas.nativeElement.height;
    this.playBeforeAbout = this.play;
    if (this.play) this.playPause();
    this.aboutClicked = !this.aboutClicked;
  }

  doneClick(event: any) {
    this.canvas.nativeElement.width = this.prevWidth;
    this.canvas.nativeElement.height = this.prevHeight;
    if (this.playBeforeAbout) this.playPause();
    this.aboutClicked = !this.aboutClicked;
    window.scroll({
      top: 0,
      left: 0
    });
    this.redraw();
  }

  getSoundOn():boolean {
    return this.audioService.isPlaying;
  }

  playSoundToggle(event: MatSlideToggleChange) {
    if (event.checked) this.audioService.playAudio();
    else this.audioService.stopAudio();
  }

  treeThicknessChange(thickness0100: any) {
    this.tree.dT = thickness0100 / 100 * 0.5;
    console.log("thickness:", this.tree.dT);
  }

  getTreeThickness() {
    return this.tree.dT * 100 / 0.5;
  }

  leafThicknessChange(leafThickness0100: any) {
    this.LeafThicknessCoefficient = Math.exp(leafThickness0100 / 100 * 4 - 2);
    console.log("leaf thickness:", this.LeafThicknessCoefficient);
  }

  getLeafThickness() {
    return (Math.log(this.LeafThicknessCoefficient) + 2) / 4 * 100;
  }

  bendChange(bend0100: any) {
    this.tree.PreviousDirectionWeight = bend0100 * 2.5;
    console.log("bend:", this.tree.PreviousDirectionWeight);
  }

  getBend() {
    return this.tree.PreviousDirectionWeight / 2.5;
  }

  leafSizeChange(leafSize0100: any) {
    this.LeafSize = leafSize0100;
    console.log("leaf size:", this.LeafSize);
  }

  getLeafSize() {
    return this.LeafSize;
  }

  drawLeaf() {
    let minD: number | undefined;
    let minV: TreeVertex | undefined;
    for (let v of this.tree.vertices) {
      const mouseX = this.getMouseX();
      const mouseY = this.getMouseY();
      const d = v.distance(mouseX, mouseY);
      if (minD == undefined || minD > d) {
        minD = d;
        minV = v;
      }
    }
    if (minV != undefined) {
      const mouseX = this.getMouseX();
      const mouseY = this.getMouseY();
      const leaf: Leaf = new Leaf(minV, mouseX, mouseY);
      this.leaves.push(leaf);
      const [x, y] = this.tree.calculateCirclePoint(minV, mouseX, mouseY);
      (async () => await this.growLeaf(x, y, mouseX, mouseY, this.LeafSize))();
    }
  }

  redraw() {
    this.clearRect();
    this.draw();
    this.drawLeaves();
  }

  draw() {
    for (let v of this.tree.vertices) {
      this.ctx.beginPath();
      this.ctx.arc(v.x + this.getCW() / 2, v.y + this.getCH(), Math.sqrt(v.T), 0, 2 * Math.PI, false)
      this.ctx.fillStyle = 'brown';
      this.ctx.fill();
    }
  }

  drawLeaves() {
    for (let l of this.leaves) {
      const [x, y] = this.tree.calculateCirclePoint(l.vertix, l.xm, l.ym);
      this.oneLeaf(x, y, l.xm, l.ym, this.LeafSize, 0.5)
    }
  }

  oneLeaf(x0_: number, y0_: number, xm_: number, ym_: number, size: number, fade: number) {
    const x0 = x0_ + this.getCW() / 2;
    const y0 = y0_ + this.getCH();
    const xm = xm_ + this.getCW() / 2;
    const ym = ym_ + this.getCH();


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

  private drawFlower = async (x0: number, y0: number, R: number) => {
    const c = Math.cos(Math.PI * 2 / 7);
    const D = (16 * c * c - 32 * c + 16) * R + 32 * R * R - 32 * R * R * c;
    const r = (4 * (1 - c) * R + Math.sqrt(D)) / (4 + 8 * c);
    for (var t = 0; t < 50; t++) {
      // await sleep(100 / 50);
      this.ctx.beginPath();
      this.ctx.arc(x0, y0, R, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(250, 0, 0, 0.01)";
      this.ctx.stroke();
      this.ctx.fillStyle = "rgba(250, 0, 0, 0.008)";
      this.ctx.fill();
    }
    for (var i = 0; i < 7; i++) {
      for (var t = 0; t < 20; t++) {
        await sleep(5);
        this.ctx.beginPath();
        const x = Math.cos(i * 2 * Math.PI / 7) * (R + r);
        const y = Math.sin(i * 2 * Math.PI / 7) * (R + r);
        this.ctx.arc(x + x0, y + y0, r, 0, Math.PI * 2);
        this.ctx.strokeStyle = "rgba(250, 0, 0, 0.02)";
        this.ctx.stroke();
        this.ctx.fillStyle = "rgba(250, 0, 0, 0.01)";
        this.ctx.fill();
      }
    }
  }
}

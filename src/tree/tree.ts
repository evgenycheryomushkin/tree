var nextId: number = 1;

export class TreeVertex {
    id: number;
    T: number;
    x: number;
    y: number;
    prev: TreeVertex | undefined;
    leaf: boolean = false;
    last: boolean = true;

    constructor(x: number, y: number, T: number, prev: TreeVertex | undefined) {
        this.id = nextId++;
        this.x = x;
        this.y = y;
        this.T = T;
        this.prev = prev;
        if (prev) prev.last = false;
    }
    distance2(last: TreeVertex): number {
        const dx = this.x - last.x;
        const dy = this.y - last.y;
        return dx * dx + dy * dy;
    }
    distance(x: number, y: number) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export class Tree {
    private time: number = 0;

    // if distance between vertix and
    // mouse is smaller then this distance
    // then grow this branch faster
    protected AttgrationDistance: number = 100;
    
    // force to attract vertix to mouse
    protected AttractionForce: number = 0.2;

    // distance were vertix is distracted from mouse
    // todo grow will stop on this distance
    protected DistractionMouseDistance: number = 1;

    // distraction force
    protected DistractionForce: number = 0.2;

    // distraction force of mouse
    protected DistractionForceMouse: number = 2;

    // distance from other vertices to distract
    // new vertix from them
    protected DistractionVerticesDistance: number = 5;

    // weight to consider previous direction
    // of grow of a tree. Previous direction is
    // considered and mouse direction is considered
    private PreviousDirectionWeight: number = 10;

    // increase on Y coordinate on each iteration
    // tree gorw towards the light
    private DY: number = 1;

    // moving the tree left to right
    // like that it foolws the sun
    private DX: number = 0.5;

    // delta thickness. Delte to grow.
    // thickness increase by this value
    private dT: number = 0.05;

    // initial thickness of tree vertix
    private T0: number = 0.1;

    private df: number = 0.01;

    vertices = new Array<TreeVertex>();
    iteration: number = 1;

    reset() {
        this.vertices = new Array<TreeVertex>();
    }

    tick(time: number, mouseX: number, mouseY: number) {
        this.iteration++;
        this.grow(time, mouseX, mouseY);
        if (this.iteration % 100 == 0)
            this.removeUnnecessary();
    }

    growIndex = 0;
    grow(time: number, mouseX: number, mouseY: number) {
        this.growIndex++;
        // if there are no vertices then
        // add on verix as root
        if (this.vertices.length == 0) {
            this.vertices.push(new TreeVertex(0, 0, this.T0, undefined));
        } else {
            // find nearest vertix
            let minD: number | undefined;
            let minV: TreeVertex | undefined;
            for (let v of this.vertices) {
                const d = v.distance(mouseX, mouseY) - Math.sqrt(v.T);
                if (minD == undefined || minD > d) {
                    minD = d;
                    minV = v;
                }
            }

            if (minV == undefined) throw Error("wrong work of vertices array");
            const v = this.calculateNewVertix(time, minV, mouseX, mouseY);
            if (v) {
                this.vertices.push(v);
                this.thick(minV);
            }
        }
    }

    thick(minV: TreeVertex) {
        var v: TreeVertex | undefined = minV;
        while (v != undefined) {
            v.T += this.dT;
            v = v.prev;
        }
    }

    // calculate point on circle and add dd distance
    // to make point a little farther away
    calculateCirclePoint(closest: TreeVertex, mouseX: number, mouseY: number, dd: number = 0) {
        const dx = mouseX - closest.x;
        const dy = mouseY - closest.y;
        const d = this.distance(closest.x, closest.y, mouseX, mouseY);

        var dxnorm = dx/d;
        var dynorm = dy/d;
        
        if (closest.last && closest.prev) {
            const dx2 = closest.x - closest.prev.x
            const dy2 = closest.y - closest.prev.y
            const d2 = Math.sqrt(dx2*dx2+dy2*dy2);

            const dx2norm = dx2 / d2;
            const dy2norm = dy2 / d2;

            dxnorm = (dx2norm * this.PreviousDirectionWeight + dxnorm) / (1 + this.PreviousDirectionWeight);
            dynorm = (dy2norm * this.PreviousDirectionWeight + dynorm) / (1 + this.PreviousDirectionWeight);
        }

        const R = Math.sqrt(closest.T);
        return [closest.x + dxnorm * (R + dd), closest.y + dynorm * (R + dd)];
    }

    calculateNewVertix(time: number, closest: TreeVertex, mouseX: number, mouseY: number): TreeVertex | undefined {
        let [xn, yn] = this.calculateCirclePoint(closest, mouseX, mouseY);

        // distance between point on circle
        // and mouse pointer
        const d2 = this.distance(xn, yn, mouseX, mouseY);

        if (d2 < this.DistractionMouseDistance) return undefined;

        var f1: number = 0;

        var forceX: number = 0;
        var forceY: number = 0;

        if (d2 < this.AttgrationDistance) {
            // mouse is near enough to speed up growing a branch
            // distance to add to point to grow
            f1 = this.AttractionForce * (1 - d2 / this.AttgrationDistance);
            forceX = (mouseX - xn) / d2 * f1;
            forceY = (mouseY - yn) / d2 * f1;
        } else {
            // tree grow up when mouse is far away
            [xn, yn] = this.calculateCirclePoint(closest, closest.x + Math.random()*20.0-10.0, closest.y - 100);
        }

        // tree wants to grow up
        forceY -= this.DY;
        var t = time;
        while (t>1) t--;
        if (t < 0.5) 
            forceX += this.DX - t*4*this.DX;
        else
            forceX += -this.DX + t*4*this.DX;

        return new TreeVertex(xn, yn, this.T0, closest);
    }

    distance(x: number, y: number, mouseX: number, mouseY: number): number {
        const dx = mouseX - x;
        const dy = mouseY - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    removeUnnecessary() {
        const visited = new Set<number>();
        const remove = new Set<number>();
        for (let v of this.vertices) {
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
        for (let v of this.vertices) {
            if (!remove.has(v.id)) newVertices.push(v);
        }
        this.vertices = newVertices;
        console.log("Filtered:", remove.size);
    }
}
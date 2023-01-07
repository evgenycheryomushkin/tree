import { TreeVertex } from "src/tree/tree";

export class Leaf {
    // leaf size
    LeafSize: number = 10;

    vertix: TreeVertex;

    xm: number;
    ym: number;

    constructor(vertix: TreeVertex, xm: number, ym:number) {
        this.vertix = vertix;
        this.xm = xm;
        this.ym = ym;
    }
}
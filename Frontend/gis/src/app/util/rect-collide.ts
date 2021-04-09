/* eslint-disable */

import { quadtree, Quadtree, QuadtreeInternalNode, QuadtreeLeaf } from 'd3-quadtree';


export type BBox = [[number, number], [number, number]];
export type CBBbox = (d?: Node, i?: number, ds?: Node[]) => BBox;

export interface RectCollideItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface CornerNode extends RectCollideItem {
  node: Node;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Node extends RectCollideItem {
  index: number;
}

interface MyQuadtreeLeaf<T> extends QuadtreeLeaf<T> {
  bb: BBox;
}

interface MyQuadtreeInternalNode<T> extends QuadtreeInternalNode<T> {
  bb: BBox;
}

export function rectCollide(bboxInput: CBBbox | BBox) {

  function x(d: CornerNode): number {
    return d.x + d.vx;
  }

  function y(d: CornerNode): number {
    return d.y + d.vy;
  }

  function constant<D>(x: D): (d?: Node, i?: number, ds?: Node[]) => D {
    return function() {
      return x;
    };
  }

  let nodes: Node[],
      boundingBoxes: BBox[],
      strength = 1,
      iterations = 1;

  let bbox: CBBbox;
  if (typeof bboxInput !== 'function') {
    bbox = constant((bboxInput as BBox) === null ? [[0, 0], [1, 1]] : (bboxInput as BBox));
  } else {
    bbox = bboxInput as CBBbox;
  }

  function force(): void {
        let i: number,
            tree: Quadtree<CornerNode>,
            node: Node,
            xi: number,
            yi: number,
            bbi: [[number, number], [number, number]],
            nx1: number,
            ny1: number,
            nx2: number,
            ny2: number,
            nodeI: number;

        const cornerNodes: CornerNode[] = [];
        nodes.forEach(function(d, i) {
          if(!d) {
            return;
          }
          cornerNodes.push({
            node: d, 
            vx: d.vx, 
            vy: d.vy, 
            x: d.x + (boundingBoxes[i][1][0] + boundingBoxes[i][0][0]) / 2, 
            y: d.y + (boundingBoxes[i][0][1] + boundingBoxes[i][1][1]) / 2}
          );
          cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][0][0], y: d.y + boundingBoxes[i][0][1]});
          cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][0][0], y: d.y + boundingBoxes[i][1][1]});
          cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][1][0], y: d.y + boundingBoxes[i][0][1]});
          cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][1][0], y: d.y + boundingBoxes[i][1][1]});
        });
        const cn = cornerNodes.length;

        for (let k = 0; k < iterations; ++k) {
          tree = quadtree<CornerNode>(cornerNodes, x, y).visitAfter(prepareCorners as any);

          for (i = 0; i < cn; ++i) {
            // Math.floor replacement
            nodeI = ~~(i / 5);
            node = nodes[nodeI];
            bbi = boundingBoxes[nodeI] as any;
            xi = node.x + node.vx;
            yi = node.y + node.vy;
            nx1 = xi + bbi[0][0];
            ny1 = yi + bbi[0][1];
            nx2 = xi + bbi[1][0];
            ny2 = yi + bbi[1][1];
            tree.visit(apply);
          }
        }

        function apply(quad: QuadtreeLeaf<CornerNode>, x0: number, y0: number, x1: number, y1: number): boolean {
            const data: CornerNode = quad.data;
            if (data) {
              const bWidth = bbLength(bbi, 0),
              bHeight = bbLength(bbi, 1);

              if (data.node.index !== nodeI) {
                const dataNode = data.node;
                const bbj = boundingBoxes[dataNode.index],
                  dnx1 = dataNode.x + dataNode.vx + bbj[0][0],
                  dny1 = dataNode.y + dataNode.vy + bbj[0][1],
                  dnx2 = dataNode.x + dataNode.vx + bbj[1][0],
                  dny2 = dataNode.y + dataNode.vy + bbj[1][1],
                  dWidth = bbLength(bbj, 0),
                  dHeight = bbLength(bbj, 1);

                if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {

                  const xSize = [Math.min.apply(null, [dnx1, dnx2, nx1, nx2]), Math.max.apply(null, [dnx1, dnx2, nx1, nx2])];
                  const ySize = [Math.min.apply(null, [dny1, dny2, ny1, ny2]), Math.max.apply(null, [dny1, dny2, ny1, ny2])];

                  const xOverlap = bWidth + dWidth - (xSize[1] - xSize[0]);
                  const yOverlap = bHeight + dHeight - (ySize[1] - ySize[0]);

                  const xBPush = xOverlap * strength * (yOverlap / bHeight);
                  const yBPush = yOverlap * strength * (xOverlap / bWidth);

                  const xDPush = xOverlap * strength * (yOverlap / dHeight);
                  const yDPush = yOverlap * strength * (xOverlap / dWidth);

                  if ((nx1 + nx2) / 2 < (dnx1 + dnx2) / 2) {
                    node.vx -= xBPush;
                    dataNode.vx += xDPush;
                  }
                  else {
                    node.vx += xBPush;
                    dataNode.vx -= xDPush;
                  }
                  if ((ny1 + ny2) / 2 < (dny1 + dny2) / 2) {
                    node.vy -= yBPush;
                    dataNode.vy += yDPush;
                  }
                  else {
                    node.vy += yBPush;
                    dataNode.vy -= yDPush;
                  }
                }

              }
              return undefined;
            }

            return x0 > nx2 || x1 < nx1 || y0 > ny2 || y1 < ny1;
        }

      }

  function prepareCorners(quad: MyQuadtreeInternalNode<CornerNode> | MyQuadtreeLeaf<CornerNode>) {
    // is quadtreeleaf
    if ((quad as QuadtreeLeaf<CornerNode>).data) {
      return quad.bb = boundingBoxes[(quad as QuadtreeLeaf<CornerNode>).data.node.index];
    }
    quad.bb = [[0, 0], [0, 0]];
    for (let i = 0; i < 4; ++i) {
        if (quad[i] && quad[i].bb[0][0] < quad.bb[0][0]) {
          quad.bb[0][0] = quad[i].bb[0][0];
        }
        if (quad[i] && quad[i].bb[0][1] < quad.bb[0][1]) {
          quad.bb[0][1] = quad[i].bb[0][1];
        }
        if (quad[i] && quad[i].bb[1][0] > quad.bb[1][0]) {
          quad.bb[1][0] = quad[i].bb[1][0];
        }
        if (quad[i] && quad[i].bb[1][1] > quad.bb[1][1]) {
          quad.bb[1][1] = quad[i].bb[1][1];
        }
    }
    return null;
  }

  function bbLength(bbox: BBox, heightWidth: number): number {
    return bbox[1][heightWidth] - bbox[0][heightWidth];
  }

  force.initialize = function(_: Node[]) {
    let i:number, n = (nodes = _).length; 
    boundingBoxes = new Array(n);
    for (i = 0; i < n; ++i) { boundingBoxes[i] = bbox(nodes[i], i, nodes); }
  };

  force.iterations = function(_: number) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_: number) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.bbox = function(_: CBBbox | BBox) {
    return arguments.length ? (bbox = typeof _ === 'function' ? _ : constant(_ as BBox), force) : bbox;
  };

  return force;
}

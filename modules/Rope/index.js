import { Container, Texture, Point, Graphics, mesh } from 'pixi.js';
import ropePattern from '../../assets/ropePattern.png';
import ropeBegin from '../../assets/ropeBegin.png';
import ropeEnd from '../../assets/ropeEnd.png';

const GRAVITY = {
  x: 0,
  y: 8,
};
const SPRING = 0.9;
const TENTION = 0.5;
const VEL = 0.1;

const ROPE_SEGMENT_LENGTH = 30;
const ROPE_WIDTH = 10;

// Utils
Math.sqr = x => x * x;
const getDistBetweenTwoVec2 = (x1, y1, x2, y2) => {
  const x = x1 - x2;
  const y = y1 - y2;
  const dist = Math.sqrt(Math.sqr(y) + Math.sqr(x));
  return { x, y, dist };
};
const canvasBuilder = (width = window.innerWidth, height = window.innerHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return {
    canvas,
    context,
    getImageData: () => context.getImageData(0, 0, width, height).data,
  };
};
const applyImageToCanvas = (url, w, h) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = (e) => {
    if (e.target.status === 200) {
      const blob = e.target.response;
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
        const width = w || image.width;
        const height = h || image.height;
        const canvasB = canvasBuilder(width, height);
        const { canvas, context } = canvasB;
        context.drawImage(image, 0, 0, width, height);
        window.URL.revokeObjectURL(blob);
        resolve(canvas);
      };
      image.onerror = () => {
        reject('Err : Canvas cannot be loaded');
      };
      image.src = window.URL.createObjectURL(blob);
    }
  };
  xhr.send();
});

export default class Rope extends Container {
  constructor(x = 0, y = 0, length = 10, color = 0xf4cd6a) {
    super();

    this.texture = null;
    this.nbrOfNodes = length;
    this.points = [];
    this.oldPoints = [];
    this.attachedPoints = new Map();
    this.count = 0;

    for (let i = 0; i < this.nbrOfNodes; i++) {
      this.points.push(new Point(
        (i * ROPE_SEGMENT_LENGTH) + x,
        y
      ));
      this.oldPoints.push(new Point(
        (i * ROPE_SEGMENT_LENGTH) + x,
        y
      ));
    }

    this.position.x = 0;
    this.position.y = 0;

    this.update = this.update.bind(this);

    this.g = new Graphics();

    this.attachPoint(0, x, y);

    this.buildRopeTexture(() => {
      this.rope = new mesh.Rope(this.texture, this.points);
      this.rope.tint = color;
      this.addChild(this.rope);
      this.addChild(this.g);
    });
  }

  buildRopeTexture(callback) {
    let canvasRopePattern = null;
    let canvasRopeBegin = null;
    applyImageToCanvas(ropePattern, ROPE_WIDTH, ROPE_WIDTH).then(cRopePattern => {
      canvasRopePattern = cRopePattern;
      return applyImageToCanvas(ropeBegin, ROPE_WIDTH, ROPE_WIDTH);
    }).then(cRopeBegin => {
      canvasRopeBegin = cRopeBegin;
      return applyImageToCanvas(ropeEnd, ROPE_WIDTH, ROPE_WIDTH);
    }).then(cRopeEnd => {
      // build rope
      const ropeWidth = this.nbrOfNodes * ROPE_SEGMENT_LENGTH;
      const { canvas, context } = canvasBuilder(ropeWidth, ROPE_WIDTH);
      const nbrOfRopePattern = (ropeWidth / canvasRopePattern.height) - 1;
      context.drawImage(canvasRopeBegin, 0, 0);
      for (let i = 1; i < nbrOfRopePattern; i++) {
        context.drawImage(canvasRopePattern, i * ROPE_WIDTH, 0);
      }
      context.drawImage(cRopeEnd, ropeWidth - ROPE_WIDTH, 0);

      this.texture = Texture.fromCanvas(canvas);
      callback();
    })
    .catch(err => {
      console.log(err);
    });
  }

  update() {
    // http://codepen.io/chribbe/pen/aHhdE?editors=0010
    for (let i = 1; i < this.nbrOfNodes; i++) {
      const previous = {
        x: this.points[i].x,
        y: this.points[i].y,
      };

      // gravity
      this.points[i].x += GRAVITY.x;
      this.points[i].y += GRAVITY.y;

      // friction
      this.points[i].x += (this.points[i].x - this.oldPoints[i].x) * VEL;
      this.points[i].y += (this.points[i].y - this.oldPoints[i].y) * VEL;

      this.oldPoints[i].x = previous.x;
      this.oldPoints[i].y = previous.y;

      // tention
      const dist = getDistBetweenTwoVec2(
        this.points[i].x,
        this.points[i].y,
        this.points[i - 1].x,
        this.points[i - 1].y,
      );
      const f = dist.dist - ROPE_SEGMENT_LENGTH;
      const fx = (dist.x / dist.dist) * SPRING * f;
      const fy = (dist.y / dist.dist) * SPRING * f;
      this.points[i].x -= fx;
      this.points[i].y -= fy;
      this.points[i - 1].x += fx * TENTION;
      this.points[i - 1].y += fy * TENTION;
    }

    // Update attached point
    for (const [key, value] of this.attachedPoints.entries()) {
      this.points[key].x = value.x;
      this.points[key].y = value.y;
    }

    // this.renderPoints();
  }

  attachPoint(idx, x, y) {
    this.attachedPoints.set(idx, { x, y });
  }

  detachPoint(idx) {
    this.attachPoints.delete(idx);
  }

  renderPoints() {
     this.g.clear();

    for (let i = 0; i < this.points.length; i++) {
      this.g.beginFill(0xff00ff);
      this.g.drawCircle(this.points[i].x, this.points[i].y, 3);
      this.g.endFill();
    }
  }
}

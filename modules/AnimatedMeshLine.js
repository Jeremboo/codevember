import {
  Mesh, Vector3, SplineCurve, Geometry,
} from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';

import { getRandomFloat } from '../../../modules/utils';


export default class AnimatedMeshLine extends Mesh {
  constructor({
    // Geometry props
    width = 0.1,
    length = 2,
    nbrOfPoints = 3,
    orientation = new Vector3(1, 0, 0),
    turbulence = new Vector3(0, 0, 0),
    // Material props
    visibleLength = 0.5,
    color = 0x000000,
    // Animation Props
    speed = 0.01,
  } = {}) {
    // * Create the main line
    const points = [];
    const currentPoint = new Vector3();
    // The size of each segment oriented in the good directon
    const segment = orientation.normalize().multiplyScalar(length / nbrOfPoints);
    points.push(currentPoint.clone());
    for (let i = 0; i < nbrOfPoints - 1; i++) {
      // Increment the point depending to the orientation
      currentPoint.add(segment);
      // Add turbulence to the current point
      points.push(currentPoint.clone().set(
        currentPoint.x + getRandomFloat(-turbulence.x, turbulence.x),
        currentPoint.y + getRandomFloat(-turbulence.y, turbulence.y),
        currentPoint.z + getRandomFloat(-turbulence.z, turbulence.z),
      ));
    }
    // Finish the curve to the correct point without turbulence
    points.push(currentPoint.add(segment).clone());

    // * Smooth the line
    // TODO 3D spline curve https://math.stackexchange.com/questions/577641/how-to-calculate-interpolating-splines-in-3d-space
    // TODO https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_nurbs.html
    const curve = new SplineCurve(points);
    const curvedPoints = curve.getPoints(50);

    // * Create the MeshLineGeometry
    const line = new MeshLine();
    line.setGeometry(new Geometry().setFromPoints(curvedPoints));
    const geometry = line.geometry;

    // * Create the Line Material
    // dashArray - the length and space between dashes. (0 - no dash)
    // dashRatio - defines the ratio between that is visible or not (0 - more visible, 1 - more invisible).
    // dashOffset - defines the location where the dash will begin. Ideal to animate the line.
    // DashArray: The length of a dash = dashArray * length.
    // Here 2 mean a cash is 2 time longer that the original length
    const dashArray = 2;
    // Start to 0 and will be decremented to show the dashed line
    const dashOffset = 0;
    // The ratio between that is visible and other
    const dashRatio = 1 - (visibleLength * 0.5); // Have to be between 0.5 and 1.

    const material = new MeshLineMaterial({
      lineWidth: width,
      dashArray,
      dashOffset,
      dashRatio, // The ratio between that is visible or not for each dash
      opacity: 1,
      transparent: true,
      depthWrite: false,
      color,
    });

    // INIT
    super(geometry, material);

    this.speed = speed;
    this.voidLength = dashArray * dashRatio; // When the visible part is out
    this.dashLength = dashArray - this.voidLength;

    this.dyingAt = 1;
    this.diedAt = this.dyingAt + this.dashLength;

    // Bind
    this.update = this.update.bind(this);
  }

  update() {
    // Increment the dash
    this.material.uniforms.dashOffset.value -= this.speed;

    // Reduce the opacity then the dash start to desapear
    if (this.isDying()) {
      this.material.uniforms.opacity.value = 0.9 + ((this.material.uniforms.dashOffset.value + 1) / this.dashLength);
    }
  }

  isDied() {
    return this.material.uniforms.dashOffset.value < -this.diedAt;
  }

  isDying() {
    return this.material.uniforms.dashOffset.value < -this.dyingAt;
  }
}
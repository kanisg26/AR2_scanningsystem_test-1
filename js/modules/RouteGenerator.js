/**
 * Converts point data into Three.js 3D objects (spheres + route lines)
 * Uses distance-based X-axis layout from v2 point data
 * @module modules/RouteGenerator
 */

import { POINT_DIAMETER, POINT_COLOR_3D, ROUTE_COLOR_3D } from '../config.js';
import { pointsToPositions } from '../utils/math.js';

/* global THREE */

export default class RouteGenerator {
  constructor() {
    this._pointMaterial = new THREE.MeshStandardMaterial({ color: POINT_COLOR_3D });
    this._lineMaterial = new THREE.LineBasicMaterial({ color: ROUTE_COLOR_3D });
    this._sphereGeometry = new THREE.SphereGeometry(POINT_DIAMETER / 2, 16, 12);
  }

  /**
   * Builds a THREE.Group from distance-based point data
   * @param {Array<{ id: number, distanceToNext: number|null }>} points
   * @returns {THREE.Group}
   */
  buildRouteGroup(points) {
    const group = new THREE.Group();
    group.name = 'routeGroup';
    if (points.length === 0) return group;

    const positions = pointsToPositions(points);

    // Feature point spheres
    positions.forEach((pos, i) => {
      const mesh = new THREE.Mesh(this._sphereGeometry, this._pointMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.userData = { pointId: points[i].id };
      group.add(mesh);
    });

    // Route line
    if (positions.length >= 2) {
      const linePoints = positions.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(geometry, this._lineMaterial);
      line.name = 'routeLine';
      group.add(line);
    }

    return group;
  }

  dispose() {
    this._pointMaterial.dispose();
    this._lineMaterial.dispose();
    this._sphereGeometry.dispose();
  }
}

/**
 * Converts point data into Three.js 3D objects (spheres + route lines)
 * @module modules/RouteGenerator
 * @see FR-P1A-005
 */

import {
  POINT_DIAMETER,
  POINT_COLOR,
  ROUTE_COLOR
} from '../config.js';

/* global THREE */

export default class RouteGenerator {
  constructor() {
    // Shared materials (reused across rebuilds)
    this._pointMaterial = new THREE.MeshStandardMaterial({ color: POINT_COLOR });
    this._lineMaterial = new THREE.LineBasicMaterial({ color: ROUTE_COLOR });
    this._sphereGeometry = new THREE.SphereGeometry(POINT_DIAMETER / 2, 16, 12);
  }

  /**
   * Builds a THREE.Group containing point spheres and route line
   * @param {Array<{ x: number, y: number, z: number, id: number }>} points
   * @returns {THREE.Group}
   */
  buildRouteGroup(points) {
    const group = new THREE.Group();
    group.name = 'routeGroup';

    if (points.length === 0) return group;

    // Feature point spheres
    points.forEach((p) => {
      const mesh = new THREE.Mesh(this._sphereGeometry, this._pointMaterial);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData = { pointId: p.id };
      group.add(mesh);
    });

    // Route line (needs at least 2 points)
    if (points.length >= 2) {
      const linePoints = points.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(geometry, this._lineMaterial);
      line.name = 'routeLine';
      group.add(line);
    }

    return group;
  }

  /** Disposes shared materials and geometry */
  dispose() {
    this._pointMaterial.dispose();
    this._lineMaterial.dispose();
    this._sphereGeometry.dispose();
  }
}

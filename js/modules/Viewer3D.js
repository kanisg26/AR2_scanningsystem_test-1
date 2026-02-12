/**
 * Three.js 3D viewer - scene, camera, renderer, controls
 * @module modules/Viewer3D
 * @see FR-P1A-005, FR-P1A-006, FR-P1A-007
 */

import {
  CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR,
  AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY,
  DIR_LIGHT_COLOR, DIR_LIGHT_INTENSITY, DIR_LIGHT_POSITION,
  GRID_SIZE, GRID_DIVISIONS, AXIS_LENGTH,
  VIEW_PRESETS
} from '../config.js';
import RouteGenerator from './RouteGenerator.js';

/* global THREE */

export default class Viewer3D {
  /**
   * @param {string} containerId - DOM id of the viewer container
   */
  constructor(containerId) {
    this._container = document.getElementById(containerId);
    this._routeGenerator = new RouteGenerator();
    this._routeGroup = null;
    this._animationId = null;

    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initLights();
    this._initHelpers();
    this._initControls();
    this._startLoop();
    this._bindResize();
  }

  // ─── Initialization ──────────────────────────────────────

  _initScene() {
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1a2e);
  }

  _initCamera() {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight || 300;
    this._camera = new THREE.PerspectiveCamera(CAMERA_FOV, w / h, CAMERA_NEAR, CAMERA_FAR);
    // Initial isometric view
    const iso = VIEW_PRESETS.iso;
    this._camera.position.set(iso.x, iso.y, iso.z);
    this._camera.lookAt(0, 0, 0);
  }

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    const w = this._container.clientWidth;
    const h = this._container.clientHeight || 300;
    this._renderer.setSize(w, h);
    this._container.appendChild(this._renderer.domElement);
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    this._scene.add(ambient);

    const dir = new THREE.DirectionalLight(DIR_LIGHT_COLOR, DIR_LIGHT_INTENSITY);
    dir.position.set(DIR_LIGHT_POSITION.x, DIR_LIGHT_POSITION.y, DIR_LIGHT_POSITION.z);
    this._scene.add(dir);
  }

  _initHelpers() {
    // Grid (1m intervals)
    const grid = new THREE.GridHelper(GRID_SIZE * GRID_DIVISIONS, GRID_DIVISIONS, 0x888888, 0x444444);
    this._scene.add(grid);

    // Axis helper (X:red, Y:green, Z:blue)
    const axes = new THREE.AxesHelper(AXIS_LENGTH);
    this._scene.add(axes);
  }

  _initControls() {
    this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.1;
    this._controls.target.set(0, 0, 0);
  }

  // ─── Render Loop ─────────────────────────────────────────

  _startLoop() {
    const animate = () => {
      this._animationId = requestAnimationFrame(animate);
      this._controls.update();
      this._renderer.render(this._scene, this._camera);
    };
    animate();
  }

  // ─── Resize ──────────────────────────────────────────────

  _bindResize() {
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this._container);
  }

  _onResize() {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight || 300;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  // ─── Route Update ────────────────────────────────────────

  /**
   * Rebuilds the 3D route from current point data
   * @param {Array<{ x: number, y: number, z: number, id: number }>} points
   */
  updateRoute(points) {
    // Remove old route group
    if (this._routeGroup) {
      this._scene.remove(this._routeGroup);
      this._disposeGroup(this._routeGroup);
    }

    // Build and add new group
    this._routeGroup = this._routeGenerator.buildRouteGroup(points);
    this._scene.add(this._routeGroup);
  }

  /**
   * Disposes non-shared geometry in a group
   * (Line geometry is unique per build; Mesh spheres share RouteGenerator geometry)
   * @param {THREE.Group} group
   */
  _disposeGroup(group) {
    group.traverse((child) => {
      if (child.isLine && child.geometry) child.geometry.dispose();
    });
  }

  // ─── View Presets (FR-P1A-007) ───────────────────────────

  /**
   * Sets camera to a named preset view
   * @param {'front'|'top'|'side'|'iso'} name
   */
  setView(name) {
    const preset = VIEW_PRESETS[name];
    if (!preset) return;

    this._camera.position.set(preset.x, preset.y, preset.z);
    this._camera.lookAt(0, 0, 0);
    this._controls.target.set(0, 0, 0);
    this._controls.update();
  }

  /**
   * Returns the Three.js scene (used by GLBExporter)
   * @returns {THREE.Scene}
   */
  getScene() {
    return this._scene;
  }

  /** Cleans up renderer, controls, animation loop */
  dispose() {
    if (this._animationId) cancelAnimationFrame(this._animationId);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._controls.dispose();
    this._renderer.dispose();
    this._routeGenerator.dispose();
    if (this._routeGroup) this._disposeGroup(this._routeGroup);
    this._container.removeChild(this._renderer.domElement);
  }
}

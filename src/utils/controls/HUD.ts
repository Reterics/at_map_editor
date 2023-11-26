import { Camera, Scene } from "three";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as THREE from "three";
import {FPSController} from "@/src/utils/controls/FPSController";


export class HUD {
    private readonly scene: Scene;
    private readonly camera: Camera;
    private object: CSS2DObject;
    private css2DRenderer: CSS2DRenderer;
    element: HTMLElement;
    private updatePeriod: number;
    private _elapsed: number;
    _preDelta: number;

    constructor(scene: Scene, camera: Camera, parentElement: HTMLElement, controller?: FPSController) {
        // Create a new CSS2DRenderer
        const cssRef = parentElement.querySelector('canvas') || parentElement;
        this.css2DRenderer = new CSS2DRenderer();
        this.css2DRenderer.setSize(cssRef.offsetWidth, cssRef.offsetHeight);
        this.css2DRenderer.domElement.style.position = 'absolute';
        this.css2DRenderer.domElement.style.top = '0';
        this.css2DRenderer.domElement.style.pointerEvents = 'none';
        parentElement.appendChild(this.css2DRenderer.domElement);
        // Store scene and camera references
        this.scene = scene;
        this.camera = camera;

        // Add an example HTML element to the HUD
        const hudElement = document.createElement('div');
        hudElement.className = 'hud-element';
        hudElement.style.height = '100%';
        hudElement.style.width = '100%';
        hudElement.style.paddingLeft = '3px';
        hudElement.textContent = 'HUD is loading...';
        this.element = hudElement;

        // Create a CSS2DObject and assign the HTML element to it
        const hudObject = new CSS2DObject(hudElement);
        hudObject.position.set(10, 10, 0); // Set the position in 3D space
        this.object = hudObject;

        // Add the CSS2DObject to the scene
        this.scene.add(hudObject);

        this.updatePeriod = 1;
        this._elapsed = 0;
        this._preDelta = 0;

        if (controller) {
            this.update(null, controller);
        }
    }

    updateText (string: string|number) {
        this.element.innerHTML = String(string);
    }

    updateLines (string: (string|number)[]) {
        this.updateText(string.join('<br>'));
    }

    updatePosition () {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.object.position.copy(this.camera.position);
        this.object.position.add(forward);
    }

    update (delta: number|null, controller: FPSController) {
        this.css2DRenderer.render(this.scene, this.camera);
        const d = delta || this._preDelta;
        this._elapsed += d;
        if (delta !== null) {
            this._preDelta = delta;
        }

        if (this._elapsed >= this.updatePeriod || delta === null) {
            this._elapsed = 0;

            const tableData = [
                Math.round(1 / d) + " FPS"
            ];

            // @ts-ignore
            if (window.performance && window.performance.memory) {
                // @ts-ignore
                const memory = window.performance.memory;
                tableData.push(Math.round(memory.usedJSHeapSize / 1048576) + " / "
                    + Math.round(memory.jsHeapSizeLimit / 1048576) + " (MB Memory)");
            }

            tableData.push("Far: " + controller.far);
            tableData.push("Mode: " + controller.active + " (KeyR)");
            tableData.push("Precision: " + controller.precision);


            this.updateLines(tableData);
        }

    }
}
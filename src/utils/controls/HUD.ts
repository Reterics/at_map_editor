import { Camera, Scene } from "three";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as THREE from "three";


export class HUD {
    private readonly scene: Scene;
    private readonly camera: Camera;
    private object: CSS2DObject;
    private css2DRenderer: CSS2DRenderer;
    element: HTMLElement;
    private updatePeriod: number;
    private _elapsed: number;

    constructor(scene: Scene, camera: Camera, parentElement: HTMLElement) {
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
    }

    updateText (string: string|number) {
        this.element.innerHTML = String(string);
    }

    updatePosition () {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.object.position.copy(this.camera.position);
        this.object.position.add(forward);
    }

    update (delta: number) {
        this.css2DRenderer.render(this.scene, this.camera);
        this._elapsed += delta;

        if (this._elapsed >= this.updatePeriod) {
            this._elapsed = 0;

            const FPS = Math.round(1 / delta);
            // @ts-ignore
            const memory = window.performance.memory;
            const memoryStats = memory ? Math.round(memory.usedJSHeapSize / 1048576) + " / "
                + Math.round(memory.jsHeapSizeLimit / 1048576) + " (MB Memory)" : "";

            this.updateText(FPS + ' FPS<br \>' + memoryStats);
        }

    }
}
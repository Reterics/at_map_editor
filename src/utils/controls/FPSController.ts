import { PerspectiveCamera, Raycaster, Scene, Vector3 } from "three";
import { Object3D } from "three/src/core/Object3D";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let sprint = false;

let prevTime = performance.now();
const velocity = new Vector3();
const direction = new Vector3();

export class FPSController {
    controls: PointerLockControls;
    private scene: Scene;
    private items: Object3D[];
    private rayCaster: Raycaster;
    target: null;
    constructor(camera: PerspectiveCamera, domElement: HTMLElement, scene: Scene) {
        this.controls =  new PointerLockControls(camera, document.body);

        const obj = this.controls.getObject();
        obj.name = "camera";
        this.target = null;
        //obj.up.set(0, 0, 1);

        const cameraInScene = scene.children.find(m=>m.name === "camera");
        if (cameraInScene) {
            // Replace old camera in scene
            scene.remove(cameraInScene)
        }
        scene.add(obj);
        this.scene = scene;
        this.items = [];
        this.updateItems();

        this.rayCaster = new Raycaster(new Vector3(), new Vector3(0, - 1, 0), 0, 10);
        this.controls.lock();
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }


    updateItems() {
        this.items = this.scene.children.filter(m=>m.name.startsWith("mesh_"));
    }
    onKeyDown(event: KeyboardEvent) {
        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                if (canJump) velocity.y += 350;
                canJump = false;
                break;

            case 'ShiftLeft':
                if (canJump) sprint = true;
                break;

        }
    }

    onKeyUp (event: KeyboardEvent) {
        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

            case 'ShiftLeft':
                sprint = false;
                break;
        }
    }

    update(deltaTime?: number | undefined) {
        const delta = deltaTime || ((performance.now() - prevTime) / 1000);
        if (this.controls && this.controls.isLocked) {

            this.rayCaster.ray.origin.copy(this.controls.getObject().position);
            this.rayCaster.ray.origin.z -= 10;

            const intersections = this.rayCaster.intersectObjects(this.items, false);

            const onObject = intersections.length > 0;

            const movingVelocityMultiplier = sprint ? 5.0 : 10.0;
            velocity.x -= velocity.x * movingVelocityMultiplier * delta;
            velocity.z -= velocity.z * movingVelocityMultiplier * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize(); // this ensures consistent movements in all directions

            if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

            if (onObject) {
                velocity.y = Math.max(0, velocity.y);
                canJump = true;
            }

            this.controls.moveRight(- velocity.x * delta);
            this.controls.moveForward(- velocity.z * delta);

            this.controls.getObject().position.y += (velocity.y * delta); // new behavior

            if (this.controls.getObject().position.y < 10) {
                velocity.y = 0;
                this.controls.getObject().position.y = 10;
                canJump = true;
            }
        }
    }

    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        this.controls.dispose();
    }

    lock() {
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
    }
}
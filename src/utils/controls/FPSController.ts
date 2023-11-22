import { Mesh, PerspectiveCamera, Raycaster, Scene, Vector3 } from "three";
import { Object3D } from "three/src/core/Object3D";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { isCollisionDetected } from "@/src/utils/model";
import { Active3DMode } from "@/src/types/three";
import { roundToPrecision } from "@/src/utils/math";

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
    private shadowObject: Object3D | undefined;
    far: number;
    precision: number;
    active: Active3DMode;
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
        this.far = 100;
        this.active = 'far';
        this.precision = 10;
        this.updateItems();

        this.rayCaster = new Raycaster(new Vector3(), new Vector3(0, - 1, 0), 0, 10);
        this.controls.lock();
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('dblclick', this.onDblClick.bind(this))
        document.addEventListener('mousemove', this.onMouseMove.bind(this))
        document.addEventListener('wheel', this.onScroll.bind(this))
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

            case 'KeyR':
                if (this.active === 'far') {
                    this.active = 'size';
                } else if (this.active === 'size') {
                    this.active = 'precision';
                } else if (this.active === 'precision') {
                    this.active = 'far';
                }
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

            if (this.controls.getObject().position.y < 35) {
                velocity.y = 0;
                this.controls.getObject().position.y = 35;
                canJump = true;
            }
        }
    }

    getCursorPosition() {
        const rect = this.controls.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();

        mouse.x = ((rect.width / 2) / rect.width) * 2 - 1;
        mouse.y = -((rect.height / 2) / rect.height) * 2 + 1;
        return mouse;
    }

    getShadowObject() {
        this.shadowObject = this.shadowObject || this.scene.children
            .find(m => m.name === "shadowObject");
        return this.shadowObject;
    }

    dropObject (object: Object3D|undefined) {
        if (object) {
            const camera = this.controls.camera;
            const movementSpeed = 3; // Adjust the speed as needed
            object.position.copy(camera.position)

            const mouse = this.getCursorPosition();
            const rayCaster = new THREE.Raycaster();
            rayCaster.setFromCamera(mouse, camera);
            const intersectObjects = this.scene.children.filter((mesh: Object3D) =>
                mesh.name.startsWith("mesh") || mesh.name === "plane");
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

            const directionVector = forward.multiplyScalar(movementSpeed);
            rayCaster.set(object.position, forward);
            const intersects = rayCaster.intersectObjects(intersectObjects,
                true);
            const objectsInPath = intersects.map(o=>o.object);


            let i = 0;
            while (!objectsInPath.find(o=> isCollisionDetected(o, object))) {
                object.position.add(directionVector);
                i++;
                if (i >= this.far) {
                    break;
                }
            }

            object.position.x = roundToPrecision(object.position.x, this.precision);
            object.position.y = roundToPrecision(object.position.y, this.precision);
            object.position.z = roundToPrecision(object.position.z, this.precision);
        }
    }

    onMouseMove (event: MouseEvent) {
        event.preventDefault();
        const shadowObject = this.getShadowObject();
        this.dropObject(shadowObject);
    }

    onDblClick (event: MouseEvent) {

        const shadowObject = this.getShadowObject();
        if (shadowObject) {
            const bulletObject = shadowObject.clone();
            this.scene.add(bulletObject);
            this.dropObject(bulletObject);
            bulletObject.name = "mesh_bullet_brick";
        }
    }

    onScroll (event: WheelEvent) {
        // Normalize wheel delta across different browsers
        // @ts-ignore
        const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

        if (this.active === 'far') {
            this.far += delta * 10;
            const shadowObject = this.getShadowObject();
            this.dropObject(shadowObject);
        } else if (this.active === 'size') {
            const shadowObject: Mesh = this.getShadowObject() as Mesh;
            const currentScale = [shadowObject.scale.x, shadowObject.scale.y, shadowObject.scale.z];
            // Calculate the new scale based on the wheel delta && Clamp the new scale to prevent it from becoming too
            // small or too large
            const clampedScale = currentScale.map(scale => Math.max(0.1,
                Math.min(scale + delta * 0.010, 3)));

            shadowObject.scale.set(clampedScale[0], clampedScale[1], clampedScale[2]);
        } else if (this.active === 'precision') {
            this.precision += delta;
        }

    }

    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
        document.removeEventListener('dblclick', this.onDblClick.bind(this));
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('wheel', this.onScroll.bind(this));
        this.controls.dispose();
    }

    lock() {
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
    }
}
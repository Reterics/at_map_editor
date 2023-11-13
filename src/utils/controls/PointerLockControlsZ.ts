/**
 * @name PointerLockControlsZ
 * @desc This is a Z axis up implementation of the original PointerLockControls from THREE.js
 */
import {
    Camera,
    Euler,
    EventDispatcher,
    Vector3
} from 'three';

const euler = new Euler(0, 0, 0, 'ZXY');

const _vector = new Vector3();

const _changeEvent = {type: 'change'};
const _lockEvent = {type: 'lock'};
const _unlockEvent = {type: 'unlock'};

const PI_2 = Math.PI / 2;

class PointerLockControlsZ extends EventDispatcher {
    camera: Camera;
    isLocked: boolean;
    domElement: HTMLElement;
    minPolarAngle: number;
    maxPolarAngle: number;
    pointerSpeed: number;
    private readonly _onMouseMove: OmitThisParameter<(event: MouseEvent) => void>;
    private readonly _onPointerlockChange: OmitThisParameter<() => void>;
    private readonly _onPointerlockError: OmitThisParameter<() => void>;

    constructor(camera: Camera, domElement: HTMLElement) {

        super();

        this.camera = camera;
        this.domElement = domElement;

        this.isLocked = false;

        // Set to constrain the pitch of the camera
        // Range is 0 to Math.PI radians
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        this.pointerSpeed = 1.0;

        this._onMouseMove = onMouseMove.bind(this);
        this._onPointerlockChange = onPointerlockChange.bind(this);
        this._onPointerlockError = onPointerlockError.bind(this);

        this.connect();

    }

    connect() {
        this.domElement.ownerDocument.addEventListener('mousemove', this._onMouseMove);
        this.domElement.ownerDocument.addEventListener('pointerlockchange', this._onPointerlockChange);
        this.domElement.ownerDocument.addEventListener('pointerlockerror', this._onPointerlockError);
    }

    disconnect() {
        this.domElement.ownerDocument.removeEventListener('mousemove', this._onMouseMove);
        this.domElement.ownerDocument.removeEventListener('pointerlockchange', this._onPointerlockChange);
        this.domElement.ownerDocument.removeEventListener('pointerlockerror', this._onPointerlockError);
    }

    dispose() {
        this.disconnect();
    }

    getObject() { // retaining this method for backward compatibility
        return this.camera;
    }

    getDirection(v: Vector3) {
        return v.set(0, 0, -1).applyQuaternion(this.camera.quaternion);

    }

    moveForward(distance: number) {
        // move forward parallel to the xz-plane
        // assumes camera.up is y-up

        const camera = this.camera;
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.crossVectors(camera.up, _vector);
        camera.position.addScaledVector(_vector, distance);

    }

    moveRight(distance: number) {
        const camera = this.camera;
        _vector.setFromMatrixColumn(camera.matrix, 0);
        camera.position.addScaledVector(_vector, distance);

    }

    lock() {
        this.domElement.requestPointerLock();
    }

    unlock() {
        this.domElement.ownerDocument.exitPointerLock();
    }

}

// event listeners

function onMouseMove(this: PointerLockControlsZ, event: MouseEvent) {

    if (!this.isLocked) return;

    // @ts-ignore
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    // @ts-ignore
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    const camera = this.camera;
    euler.setFromQuaternion(camera.quaternion);

    if (euler.y <= 0.01 && euler.y >= -0.01) {
        euler.z -= movementX * 0.002;
        euler.x -= movementY * 0.002;
        if (euler.x < 0) {
            euler.x = 0;
        }
        if (euler.x > PI_2) {
            euler.x = euler.x - 0.01;
            euler.y = Math.PI;
            euler.z = euler.z - Math.PI;
        }
    } else {
        euler.z -= movementX * 0.002;
        euler.x += movementY * 0.002;
        if (euler.x < 0) {
            euler.x = 0;
        }
        if (euler.x > PI_2) {
            euler.x = euler.x - 0.01;
            euler.y = 0;
            euler.z = euler.z - Math.PI;
        }
    }
    camera.quaternion.setFromEuler(euler);

    // @ts-ignore
    this.dispatchEvent(_changeEvent);

}

function onPointerlockChange(this: PointerLockControlsZ) {
    if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
        // @ts-ignore
        this.dispatchEvent(_lockEvent);
        this.isLocked = true;

    } else {
        // @ts-ignore
        this.dispatchEvent(_unlockEvent);
        this.isLocked = false;
    }

}

function onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');

}

export {PointerLockControlsZ};

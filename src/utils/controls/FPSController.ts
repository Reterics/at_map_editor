import {Camera, Color, PerspectiveCamera, Raycaster, Scene, Vector3} from "three";
import {Object3D} from "three/src/core/Object3D";
import {PointerLockControlsZ} from "@/src/utils/controls/PointerLockControlsZ";

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new Vector3();
const direction = new Vector3();
const vertex = new Vector3();
const color = new Color();

export class FPSController {
    controls: PointerLockControlsZ;
    private scene: Scene;
    private items: Object3D[];
    private rayCaster: Raycaster;
    private camera: Camera;
    target: null;
    constructor(camera: PerspectiveCamera, domElement: HTMLElement, scene: Scene) {
        this.controls =  new PointerLockControlsZ(camera, document.body);

        const obj = this.controls.getObject();
        obj.name = "camera";
        this.camera = obj;
        this.target = null;
        //obj.position.set( 0, 0, 0);
        obj.up.set(0, 0, 1);

        const cameraInScene = scene.children.find(m=>m.name === "camera");
        if (cameraInScene) {
            // Replace old camera in scene
            scene.remove(cameraInScene)
        }
        scene.add(obj);
        this.scene = scene;
        this.items = [];
        this.updateItems();

        this.rayCaster = new Raycaster( new Vector3(), new Vector3( 0, - 1, 0 ), 0, 10 );
        this.controls.lock();

        document.addEventListener( 'keydown', this.onKeyDown );
        document.addEventListener( 'keyup', this.onKeyUp );

    }


    updateItems() {
        this.items = this.scene.children.filter(m=>m.name.startsWith("mesh_"));
    }
    onKeyDown(event: KeyboardEvent) {
        switch ( event.code ) {

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
                if ( canJump ) velocity.y += 350;
                canJump = false;
                break;

        }
    }

    onKeyUp (event: KeyboardEvent) {
        console.log("event");
        switch ( event.code ) {

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

        }
    }

    update(deltaTime?: number | undefined) {
        const delta = deltaTime || (( performance.now() - prevTime ) / 1000);
        if ( this.controls && this.controls.isLocked ) {

            this.rayCaster.ray.origin.copy( this.controls.getObject().position );
            this.rayCaster.ray.origin.z -= 10;

            const intersections = this.rayCaster.intersectObjects( this.items, false );

            const onObject = intersections.length > 0;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.y -= velocity.y * 10.0 * delta;

            velocity.z -= 9.8 * 100.0 * delta; // 100.0 = mass

            direction.y = Number( moveForward ) - Number( moveBackward );
            direction.x = Number( moveRight ) - Number( moveLeft );
            direction.normalize(); // this ensures consistent movements in all directions

            if ( moveForward || moveBackward ) velocity.y -= direction.y * 400.0 * delta;
            if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

            if ( onObject ) {
                velocity.z = Math.max( 0, velocity.z );
                canJump = true;
            }

            this.controls.moveRight( - velocity.x * delta );
            this.controls.moveForward( - velocity.y * delta );

            this.controls.getObject().position.z += ( velocity.z * delta ); // new behavior

            if ( this.controls.getObject().position.z < 10 ) {
                velocity.z = 0;
                this.controls.getObject().position.z = 10;
                canJump = true;
            }
        }
    }

    dispose() {
        document.removeEventListener( 'keydown', this.onKeyDown );
        document.removeEventListener( 'keyup', this.onKeyUp );
        this.controls.dispose();
    }

    lock() {
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
    }
}
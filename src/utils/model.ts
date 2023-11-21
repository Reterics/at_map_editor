import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import {
    ArrowHelper,
    BoxGeometry,
    BufferGeometry,
    Color,
    CylinderGeometry,
    Group,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    NormalBufferAttributes,
    Object3DEventMap,
    PerspectiveCamera,
    Quaternion,
    Scene,
    SphereGeometry,
    TextureLoader,
    Vector3,
    WebGLRenderer
} from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Loader } from "three/src/Three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { Object3D } from "three/src/core/Object3D";
import { AssetObject, Circle, Line, Rectangle } from "@/src/types/assets";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ThreeControlType } from "@/src/types/general";
import { FPSController } from "@/src/utils/controls/FPSController";

const genericLoader = (file: File, modelLoader: Loader) => {
    return new Promise(resolve => {
        if (file) {
            return modelLoader.load(URL.createObjectURL(file), resolve);
        }
        return resolve(null);
    });
};

export const loadModel = {
    gltf: async (file: File): Promise<Group<Object3DEventMap> | null> => {
        const object = await genericLoader(file, new GLTFLoader());
        if (object) {
            const gltf = object as GLTF;
            return gltf.scene;
        }
        return null;
    },
    fbx: async (file: File): Promise<Group<Object3DEventMap>|null> => {
        const object = await genericLoader(file, new FBXLoader());
        if (object) {
            return object as Group<Object3DEventMap>;
        }
        return null;
    },
    obj: async (file: File): Promise<Group<Object3DEventMap>|null> => {
        const object = await genericLoader(file, new OBJLoader());
        if (object) {
            return object as Group<Object3DEventMap>;
        }
        return null;
    },
    collada: async (file: File): Promise<Group<Object3DEventMap>|null> => {
        const object = await genericLoader(file, new ColladaLoader());
        if (object) {
            return object as Group<Object3DEventMap>;
        }
        return null;
    },
    stl: async (file: File): Promise<Mesh<BufferGeometry<NormalBufferAttributes>, MeshPhongMaterial, Object3DEventMap>|
        null> => {
        const geometry = await genericLoader(file, new STLLoader());
        if (geometry) {
            const material = new MeshPhongMaterial({ color: 0xff9c7c, specular: 0x494949, shininess: 200 });
            return new Mesh(geometry as BufferGeometry, material);
        }
        return null;
    }
}

export const lookAtObject = (models: Object3D, camera: PerspectiveCamera): void => {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(models);
    const boundingBoxCenter = new THREE.Vector3();
    boundingBox.getCenter(boundingBoxCenter);
    const boundingBoxSize = new THREE.Vector3();
    boundingBox.getSize(boundingBoxSize);
    const boundingBoxDistance = boundingBoxSize.length();

    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(boundingBoxCenter);

    cameraPosition.z += boundingBoxDistance;
    camera.position.copy(cameraPosition);
    camera.lookAt(boundingBoxCenter);
}

export const getMeshForItem = (item: AssetObject): THREE.Mesh => {
    let model;

    let material;
    if (item.texture) {
        const textureLoader = new TextureLoader();
        const texture = textureLoader.load(
            item.texture
        );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        material = new MeshStandardMaterial({
            map: texture,
        });
        material.needsUpdate = true;
    } else {
        material = new MeshStandardMaterial({ color: item.color ?
                new Color(item.color) : 0x000000 })
    }
    let geometry;
    let position1, position2;
    switch (item.type) {
        case "rect":
            const rect = item as Rectangle;
            geometry = new BoxGeometry(rect.w, Math.round((rect.w + rect.h) / 2), rect.h);
            break;
        case "circle":
            geometry = new SphereGeometry((item as Circle).radius, 32, 16);
            break;
        case "line":
            const line = item as Line;
            position1 = new Vector3(line.x1, 0, line.y1);
            position2 = new Vector3(line.x2, 0, line.y2);
            const height = position1.distanceTo(position2);
            geometry = new CylinderGeometry(5, 5, height, 32);
    }
    model = new Mesh(geometry, material);
    model.castShadow = true; //default is false
    model.receiveShadow = false; //default
    // Position must be ZYX instead of ZXY
    if (model && position1 && position2) {
        const positionMid = new Vector3();
        positionMid.addVectors(position1, position2).multiplyScalar(0.5);
        model.position.copy(positionMid);
        const direction = new Vector3();
        direction.subVectors(position2, position1).normalize();

        const quaternion = new Quaternion();
        quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        model.setRotationFromQuaternion(quaternion);
    } else if (model && item.type === "rect") {
        const rect = item as Rectangle;
        const z = rect.z || 0;
        model.position.set(rect.x + rect.w / 2, z + Math.round((rect.w + rect.h) / 2) / 2, rect.y + rect.h / 2);
    } else if (model && typeof item.x === 'number' && typeof item.y === "number") {
        model.position.set(item.x, item.z || 0, item.y);
    }
    return model;
};

export const getArrowHelper = (): Group => {
    const arrowGroup = new Group();
    arrowGroup.name = "arrows";
    const xAxisDirection = new Vector3(1, 0, 0);
    const yAxisDirection = new Vector3(0, 1, 0);
    const zAxisDirection = new Vector3(0, 0, 1);

    const origin = new Vector3(0, 0, 0);
    const length = 100;

    const xAxisArrow = new ArrowHelper(xAxisDirection, origin, length, 0xff0000);
    const yAxisArrow = new ArrowHelper(yAxisDirection, origin, length, 0x00ff00);
    const zAxisArrow = new ArrowHelper(zAxisDirection, origin, length, 0x0000ff);

    arrowGroup.add(xAxisArrow);
    arrowGroup.add(yAxisArrow);
    arrowGroup.add(zAxisArrow);

    return arrowGroup;
}

export const getGroundPlane = (width: number, height: number, texture?:string): Promise<Mesh<THREE.PlaneGeometry, MeshStandardMaterial, Object3DEventMap>> => {
    return new Promise(resolve => {
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        const loader = new THREE.TextureLoader();
        loader.load(texture || '/assets/textures/green-grass-textures.jpg',
            function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set(0, 0);
                texture.repeat.set(2, 2);
                material.map = texture;
                material.needsUpdate = true;
                const plane = new THREE.Mesh(geometry, material);
                plane.position.setY(0);
                plane.receiveShadow = true;
                plane.rotation.set(Math.PI / 2, 0, 0);

                //plane.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI);
                plane.name = "plane";
                resolve(plane);
            });
    });
}


export const getControls = (type: ThreeControlType, camera:PerspectiveCamera, renderer: WebGLRenderer, scene: Scene) => {
    switch (type) {
        case "trackball":
            return new TrackballControls(camera, renderer.domElement);
        case "fps":
            return new FPSController(camera, renderer.domElement, scene)
        case "orbit":
        case "object":
        default:
            const controls = new OrbitControls(camera, renderer.domElement);
            //controls.maxPolarAngle = Math.PI / 2;
            return controls;
    }
}

export const setInitialCameraPosition = (
    camera:PerspectiveCamera,
    renderer: WebGLRenderer,
    controls: TrackballControls | OrbitControls | FPSController,
    scene: Scene,
    width: number,
    height: number,
    threeControl: ThreeControlType,
    selected?: AssetObject) => {
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    let lookAt;
    switch (threeControl) {
        case "object":
            if (selected) {
                const mesh = getMeshForItem(selected);
                lookAt = mesh.position;
            } else {
                lookAt = new THREE.Vector3(Math.round(width/2), 0, Math.round(height/2));
            }
            break;
        case "fps":
        case "orbit":
        case "trackball":
        default:
            lookAt = new THREE.Vector3(Math.round(width/2), 0, Math.round(height/2));
    }
    if (threeControl !== "fps") {
        camera.position.copy(lookAt);
        camera.position.x = +Math.round(Math.max(height, width) * 3 / 4);
        camera.position.y = +Math.round(Math.max(height, width) * 3 / 4);
        if (controls.target) {
            controls.target.copy(lookAt);
        }
    } else {
        camera.position.y = 50;
    }

    renderer.render(scene, camera);
}

export const createShadowObject = (reference: AssetObject) => {
    const config = {
        ...reference,
        color: "#3cffee",
    };
    switch (reference.type) {
        case "rect":
            (config as Rectangle).w = 50;
            (config as Rectangle).h = 50;
            break;
        case "circle":
            (config as Circle).radius = 25;
            break;
    }
    const shadowObject = getMeshForItem(config);
    shadowObject.name = "shadowObject";
    (shadowObject.material as THREE.MeshBasicMaterial).opacity = 0.5;
    (shadowObject.material as THREE.MeshBasicMaterial).needsUpdate = true;
    shadowObject.position.y = -100;
    return shadowObject;
}

export const isCollisionDetected = (object1: THREE.Object3D, object2: THREE.Object3D) => {
    const box1 = new THREE.Box3().setFromObject(object1);
    const box2 = new THREE.Box3().setFromObject(object2);

    return box1.intersectsBox(box2);
}
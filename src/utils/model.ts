import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {
    ArrowHelper,
    BoxGeometry,
    BufferGeometry, Color, CylinderGeometry,
    Group,
    Mesh, MeshBasicMaterial,
    MeshPhongMaterial,
    NormalBufferAttributes,
    Object3DEventMap,
    PerspectiveCamera, Quaternion, SphereGeometry, Vector3
} from "three";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Loader} from "three/src/Three";
import {ColladaLoader} from "three/examples/jsm/loaders/ColladaLoader";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import {Object3D} from "three/src/core/Object3D";
import {AssetObject, Circle, Line, Rectangle} from "@/src/types/assets";

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
            const material = new MeshPhongMaterial( { color: 0xff9c7c, specular: 0x494949, shininess: 200 } );
            return new Mesh( geometry as BufferGeometry, material );
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
    let material = new MeshBasicMaterial({ color: item.color ?
            new Color(item.color) : 0x000000 });
    let geometry;
    let position1, position2;
    switch (item.type) {
        case "rect":
            const rect = item as Rectangle;
            geometry = new BoxGeometry(rect.w, rect.h, Math.round((rect.w + rect.h) / 2));
            break;
        case "circle":
            geometry = new SphereGeometry((item as Circle).radius, 32, 16 );
            break;
        case "line":
            const line = item as Line;
            position1 = new Vector3(line.x1, line.y1, 0);
            position2 = new Vector3(line.x2, line.y2, 0);
            const height = position1.distanceTo(position2);

            geometry = new CylinderGeometry( 5, 5, height, 32 );
    }
    model = new Mesh(geometry, material);
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
        model.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.z || 0);
    } else if (model && typeof item.x === 'number' && typeof item.y === "number") {
        model.position.set(item.x, item.y, item.z || 0);
    }
    return model;
};

export const getArrowHelper = (): Group => {
    const arrowGroup = new Group();
    arrowGroup.name = "arrows";
    const xAxisDirection = new Vector3(1, 0, 0);
    const yAxisDirection = new Vector3(0, 1, 0);
    const zAxisDirection = new Vector3(0, 0, 1);

    const origin = new Vector3( 0, 0, 0 );
    const length = 100;

    const xAxisArrow = new ArrowHelper(xAxisDirection, origin, length, 0xff0000);
    const yAxisArrow = new ArrowHelper(yAxisDirection, origin, length, 0x00ff00);
    const zAxisArrow = new ArrowHelper(zAxisDirection, origin, length, 0x0000ff);

    arrowGroup.add(xAxisArrow);
    arrowGroup.add(yAxisArrow);
    arrowGroup.add(zAxisArrow);

    return arrowGroup;
}

export const getGroundPlane = (width: number, height: number, texture?:string): Promise<Mesh<THREE.PlaneGeometry, MeshBasicMaterial, Object3DEventMap>> => {
    return new Promise(resolve => {
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const loader = new THREE.TextureLoader();
        loader.load(texture || '/assets/textures/green-grass-textures.jpg',
            function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 2, 2 );
                material.map = texture;
                material.needsUpdate = true;
                const plane = new THREE.Mesh( geometry, material );
                plane.position.setZ(-1);
                plane.name = "plane";
                resolve(plane);
            });
    });
}
import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {
    BufferGeometry,
    Group,
    Mesh,
    MeshPhongMaterial,
    NormalBufferAttributes,
    Object3DEventMap,
    PerspectiveCamera
} from "three";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Loader} from "three/src/Three";
import {ColladaLoader} from "three/examples/jsm/loaders/ColladaLoader";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import {Object3D} from "three/src/core/Object3D";

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
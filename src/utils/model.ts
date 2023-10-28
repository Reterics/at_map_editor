import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Group, Object3DEventMap} from "three";

export const loadModel = {
    gltf: (file: File): Promise< Group<Object3DEventMap>|null> => {
        return new Promise(resolve => {
            if (file) {
                const loader = new GLTFLoader();
                return loader.load(URL.createObjectURL(file), (gltf: GLTF) => {
                    resolve(gltf.scene);
                });
            }
            return resolve(null);
        })
    }
}
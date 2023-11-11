import * as THREE from "three";
import {Scene} from "three";


export function renderEnvironment(scene: Scene) {
    if (!scene.children.find(m => m.name === "light")) {
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        directionalLight.name = "light";
        directionalLight.position.z = 500;
        directionalLight.castShadow = true;
        scene.add( directionalLight );
    }

    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    // ambientLight.name = "ambientLight";
    // scene.add(ambientLight)
}
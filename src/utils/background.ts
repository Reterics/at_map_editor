import * as THREE from "three";
import {Scene} from "three";


export function renderEnvironment(scene: Scene) {
    if (!scene.children.find(m => m.name === "light")) {
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
        directionalLight.name = "light";
        directionalLight.position.z = 9900;
        directionalLight.castShadow = true;
        scene.add( directionalLight );
    }
    if (!scene.children.find(m => m.name === "sky")) {
        const skyGeo = new THREE.SphereGeometry(10000, 25, 25);
        const loader  = new THREE.TextureLoader();
        loader.load( "/assets/textures/sky.jpg", (texture) => {
            const material = new THREE.MeshPhongMaterial({
                map: texture,
            });
            const skyMesh = new THREE.Mesh(skyGeo, material);
            skyMesh.material.side = THREE.BackSide;
            skyMesh.name = "sky";
            material.needsUpdate = true;

            skyMesh.matrixWorldNeedsUpdate = true;
            scene.add(skyMesh);
        } );

    }
    if (!scene.children.find(m => m.name === "hemisphereLight")) {
        const hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0x00ff00, 4.0 );
        hemisphereLight.name = "hemisphereLight";
        scene.add(hemisphereLight);
    }
}
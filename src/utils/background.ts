import * as THREE from "three";
import {Scene} from "three";
import {Sky} from "three/examples/jsm/objects/Sky";


export function getSky() {
    const sky = new Sky();
    sky.scale.setScalar( 450000 );
    sky.name = "sky";

    const sun = new THREE.Vector3();
    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = 10;
    uniforms[ 'rayleigh' ].value = 3;
    uniforms[ 'mieCoefficient' ].value = 0.005;
    uniforms[ 'mieDirectionalG' ].value = 0.7;

    const phi = THREE.MathUtils.degToRad( 90 - 2 );
    const theta = THREE.MathUtils.degToRad( 180 );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );
    return sky;
}

export function renderEnvironment(scene: Scene) {
    if (!scene.children.find(m => m.name === "sky")) {
        const sky = getSky();
        scene.add( sky );
    }


    if (!scene.children.find(m => m.name === "ambientLight")) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
        ambientLight.name = "ambientLight";
        scene.add(ambientLight)
    }
}
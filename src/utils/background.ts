import * as THREE from "three";
import { Scene } from "three";
import { Sky } from "three/examples/jsm/objects/Sky";


export function getSky() {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    sky.name = "sky";

    const sun = new THREE.Vector3();
    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = 10;
    uniforms[ 'rayleigh' ].value = 3;
    uniforms[ 'mieCoefficient' ].value = 0.005;
    uniforms[ 'mieDirectionalG' ].value = 0.7;

    const phi = THREE.MathUtils.degToRad(90 - 2);
    const theta = THREE.MathUtils.degToRad(180);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms[ 'sunPosition' ].value.copy(sun);
    return sky;
}

export function renderEnvironment(scene: Scene) {
    if (!scene.children.find(m => m.name === "sky")) {
        const sky = getSky();
        scene.add(sky);

        if (!scene.children.find(m => m.name === "light")) {
            const light = new THREE.DirectionalLight(0xffffff, 6.2);
            light.name = "light";
            //light.position.set( 0, 20, -300 );
            light.castShadow = true;
            //Set up shadow properties for the light
            /*light.shadow.mapSize.width = 512; // default
            light.shadow.mapSize.height = 512; // default
            light.shadow.camera.near = 0.5; // default
            light.shadow.camera.far = 1000; // default*/
            if (sky && sky.material && sky.material.uniforms &&
                sky.material.uniforms['sunPosition'] && sky.material.uniforms['sunPosition'].value) {
                light.position.copy(sky.material.uniforms['sunPosition'].value);
            }
            scene.add(light);
        }
    }


    if (!scene.children.find(m => m.name === "ambientLight")) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
        ambientLight.name = "ambientLight";
        scene.add(ambientLight)
    }
}
import * as THREE from "three";
import {Sky} from "three/examples/jsm/objects/Sky";
import {Scene} from "three";


export function renderEnvironment(scene: Scene) {

    const upColor = 0xFFFF80;
    const downColor = 0x4040FF;
    const light = new THREE.HemisphereLight(upColor, downColor, 1.0);
    light.rotation.z = 90 * Math.PI/180;
    light.rotation.x = -90 * Math.PI/180;
    light.name = "light";
    light.position.set(0, 0, 1);
    //scene.add(light);

    const sky = new Sky();
    sky.scale.setScalar( 450000 );
    sky.name = "sky";
    sky.rotation.z = 90 * Math.PI/180;
    sky.rotation.x = -90 * Math.PI/180;
    sky.position.set(0, 0, 1);

    scene.add( sky );

    const sun = new THREE.Vector3();
    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = 10;
    uniforms[ 'rayleigh' ].value = 3;
    uniforms[ 'mieCoefficient' ].value = 0.005;
    uniforms[ 'mieDirectionalG' ].value = 0.7;

    const phi = THREE.MathUtils.degToRad( 90 - 2 );
    const theta = THREE.MathUtils.degToRad( 270 );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    ambientLight.name = "ambientLight";
    //scene.add(ambientLight)
}
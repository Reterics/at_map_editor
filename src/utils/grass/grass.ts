import {Clock, DoubleSide, InstancedMesh, Matrix4, PlaneGeometry, Scene, ShaderMaterial} from "three";
import {Object3D} from "three/src/core/Object3D";
import {GrassOptions} from "@/src/types/grass";

import vertexShader from "./grass.vert";
import fragmentShader from "./grass.frag";

const uniforms = {
    time: {
        value: 0
    }
}

export class Grass {
    private clock: Clock;
    private readonly instances: number;
    private scene: Scene;
    private readonly leavesMaterial: ShaderMaterial;
    private width: number;
    private height: number;
    private instancedMesh?: InstancedMesh<PlaneGeometry, ShaderMaterial>;

    constructor (scene: Scene, options?: GrassOptions) {
        const opt: GrassOptions = options || {};
        this.scene = scene;
        this.clock = new Clock();
        this.instances = opt.instances || 1000;
        this.width = opt.width || 1000;
        this.height = opt.height || 1000;
        this.leavesMaterial = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            side: DoubleSide
        });
    }

    getFromScene() {
        return this.scene.children.find(mesh => mesh.name === 'grass');
    }

    addToScene() {
        const grass = this.getFromScene();
        if (grass) {
            this.scene.remove(grass);
        }

        const geometry = new PlaneGeometry( 1, 10, 2, 4 );
        geometry.translate( 0, 0.5, 0 );

        this.instancedMesh = new InstancedMesh(geometry, this.leavesMaterial, this.instances);
        this.instancedMesh.name = "grass";
        this.scene.add(this.instancedMesh);
        const temp = new Object3D();
        const rotationMatrix = new Matrix4(); // Create a rotation matrix

        for ( let i=0 ; i< this.instances ; i++ ) {
            temp.position.set(
                (Math.random()) * this.width ,
                4,
                (Math.random()) * -this.height
            );

            temp.scale.setScalar( 0.5 + Math.random() * 0.5 );
            temp.rotation.y = Math.random() * Math.PI;
            //temp.rotation.z = Math.random() * Math.PI;
            temp.updateMatrix();

            rotationMatrix.makeRotationX(Math.PI / 2); // Rotate around the X-axis

            temp.matrix.multiplyMatrices(rotationMatrix, temp.matrix);


            //temp.updateMatrix();
            this.instancedMesh.setMatrixAt( i, temp.matrix );
        }

    }

    refresh() {
        this.leavesMaterial.uniforms.time.value = this.clock.getElapsedTime();
        this.leavesMaterial.uniformsNeedUpdate = true;
    }

    destroy() {
        if (this.instancedMesh) {
            this.scene.remove(this.instancedMesh);
        }
    }
}


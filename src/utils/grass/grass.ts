import { Clock, DoubleSide, InstancedMesh, PlaneGeometry, Scene, ShaderMaterial, TypedArray } from "three";
import { Object3D } from "three/src/core/Object3D";
import { GrassOptions } from "@/src/types/grass";

import vertexShader from "./grass.vert";
import fragmentShader from "./grass.frag";
import { RenderedPlane } from "@/src/types/assets";
import { randomNum } from "@/src/utils/math";
import { Constants } from "@/src/constants";

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
    private size: number;
    private instancedMesh?: InstancedMesh<PlaneGeometry, ShaderMaterial>;
    private enabled: Boolean;

    constructor (scene: Scene, options?: GrassOptions) {
        const opt: GrassOptions = options || {};
        this.scene = scene;
        this.clock = new Clock();
        this.instances = opt.instances || 1000;
        this.size = opt.size || 10000;
        this.enabled = opt.enabled || false;
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

    regenerateGrassCoordinates() {
        if (!this.instancedMesh) {
            return false;
        }
        const plane = this.scene.children.find(mesh=> mesh.name === "plane") as RenderedPlane|undefined;
        let vertices: TypedArray;
        if (!plane || plane.geometry.attributes.position.array.length < 10000) {
            vertices = new Uint8Array().fill(Constants.plane.waterLevel,0, 30000);
        } else {
            vertices = plane.geometry.attributes.position.array;
        }
        const temp = new Object3D();
        const segments = Math.min(99, this.size - 1),
            cSize = segments + 1,
            ratio = cSize / this.size,
            hW = this.size / 2;

        for (let index=0 ; index < this.instances ; index++) {
            const j = randomNum(cSize - 1, 0);
            const i = randomNum(cSize - 1, 0);

            const n = (Math.round(i) * cSize + Math.round(j)) * 3;

            const heightOnPos = vertices[n + 2] - Constants.plane.waterLevel + 0.2;

            temp.position.set(
                j / ratio - hW, // +10
                heightOnPos || 0.2,
                i / ratio - hW,
            );

            temp.scale.setScalar(0.5 + Math.random() * 0.5);
            temp.rotation.y = Math.random() * Math.PI;
            temp.updateMatrix();

            this.instancedMesh.setMatrixAt(index, temp.matrix);
        }

        this.instancedMesh.updateMatrix();
    }

    addToScene() {
        const grass = this.getFromScene();
        if (grass) {
            this.scene.remove(grass);
        }

        const geometry = new PlaneGeometry(0.1, 0.3, 2, 4);
        geometry.translate(0, 0, 0);

        this.instancedMesh = new InstancedMesh(geometry, this.leavesMaterial, this.instances);
        this.instancedMesh.castShadow = true;
        this.instancedMesh.name = "grass";
        this.instancedMesh.position.set(this.size / 2, 0, this.size / 2);

        this.scene.add(this.instancedMesh);
        this.regenerateGrassCoordinates();
    }

    refresh() {
        if (!this.enabled) {
            return this.destroy();
        }
        if (!this.instancedMesh) {
            this.addToScene();
        }
        this.leavesMaterial.uniforms.time.value = this.clock.getElapsedTime();
        this.leavesMaterial.uniformsNeedUpdate = true;
    }

    destroy() {
        if (this.instancedMesh) {
            this.scene.remove(this.instancedMesh);
            this.instancedMesh.dispose();
            this.instancedMesh = undefined;
        }
    }

    isEnabled(bool?: boolean) {
        if (typeof bool === "boolean") {
            this.enabled = bool;
        }
        return this.enabled;
    }

    setSize(size: number) {
        if (size && size !== this.size) {
            this.size = size;
            this.regenerateGrassCoordinates();
        }
    }
}


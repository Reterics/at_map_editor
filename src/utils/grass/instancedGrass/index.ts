import {
    Clock,
    DoubleSide,
    InstancedMesh,
    PlaneGeometry,
    RawShaderMaterial,
    Scene,
    TypedArray
} from "three";
import { Object3D } from "three/src/core/Object3D";
import { GrassOptions } from "@/src/types/grass";

import vertexShader from "./grass.vert";
import fragmentShader from "./grass.frag";
import { RenderedPlane } from "@/src/types/assets";
import { randomNum } from "@/src/utils/math";
import { Constants } from "@/src/constants";
import { BufferGeometry } from "three/src/core/BufferGeometry";
import { Grass } from "@/src/utils/grass";

const uniforms = {
    time: {
        value: 0
    }
}

export default class InstancedGrass implements Grass {
    clock: Clock;
    scene: Scene;
    readonly instances: number;
    readonly grassMaterial: RawShaderMaterial;
    size: number;
    mesh?: InstancedMesh<BufferGeometry, RawShaderMaterial>;
    enabled: boolean;
    geometry: BufferGeometry;

    constructor (scene: Scene, options?: GrassOptions) {
        const opt: GrassOptions = options || {};
        this.scene = scene;
        this.clock = new Clock();
        this.instances = opt.instances || 1000;
        this.size = opt.size || 10000;
        this.enabled = opt.enabled || false;
        this.grassMaterial = new RawShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            side: DoubleSide
        });
        const geometry = new PlaneGeometry(0.1, 0.3, 2, 4);
        geometry.translate(0, 0, 0);
        this.geometry = geometry;
    }

    getFromScene() {
        return this.scene.children.find(mesh => mesh.name === 'grass');
    }

    regenerateGrassCoordinates() {
        if (!this.mesh) {
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

            this.mesh.setMatrixAt(index, temp.matrix);
        }

        this.mesh.updateMatrix();
    }

    addToScene() {
        const grass = this.getFromScene();
        if (grass) {
            this.scene.remove(grass);
        }

        this.mesh = new InstancedMesh(this.geometry, this.grassMaterial, this.instances);
        this.mesh.castShadow = true;
        this.mesh.name = "grass";
        this.mesh.position.set(this.size / 2, 0, this.size / 2);

        this.scene.add(this.mesh);
        this.regenerateGrassCoordinates();
    }

    refresh() {
        if (!this.enabled) {
            return this.destroy();
        }
        if (!this.mesh) {
            this.addToScene();
        }
        this.grassMaterial.uniforms.time.value = this.clock.getElapsedTime();
        this.grassMaterial.uniformsNeedUpdate = true;
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.dispose();
            this.mesh = undefined;
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


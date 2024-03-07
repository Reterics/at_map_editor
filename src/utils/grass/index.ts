import { BufferGeometry, Clock, Mesh, RawShaderMaterial, Scene } from "three";
import { Object3D } from "three/src/core/Object3D";

export interface Grass {
    clock: Clock;
    scene: Scene;
    readonly instances: number;
    readonly grassMaterial: RawShaderMaterial;
    size: number;
    mesh?: Mesh<BufferGeometry, RawShaderMaterial>;
    enabled: Boolean;
    geometry: BufferGeometry;

    getFromScene: ()=>Object3D|undefined

    regenerateGrassCoordinates: ()=>void
    addToScene: ()=>void
    refresh: ()=>void
    destroy: ()=>void
    isEnabled: (bool: boolean)=>Boolean
    setSize: (size: number)=>void
}
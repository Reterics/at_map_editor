import {
    Clock, DoubleSide, InstancedBufferAttribute,
    InstancedBufferGeometry,
    IUniform, Mesh, MeshNormalMaterial, PlaneGeometry, Quaternion,
    RawShaderMaterial,
    Scene, TextureLoader, Vector2, Vector3,
} from "three";
import vertexShader from "./grass.vert";
import fragmentShader from "./grass.frag";
import { GrassOptions } from "@/src/types/grass";
import { Grass } from "@/src/utils/grass";

export default class SerenityGrass implements Grass {
    clock: Clock;
    scene: Scene;
    readonly instances: number;
    readonly grassMaterial: RawShaderMaterial;
    size: number;
    mesh?: Mesh<InstancedBufferGeometry, RawShaderMaterial>;
    enabled: boolean;
    geometry: InstancedBufferGeometry;

    constructor (scene: Scene, options?: GrassOptions) {
        const opt: GrassOptions = options || {};
        this.scene = scene;
        this.clock = new Clock();
        this.instances = opt.instances || 1000;
        this.size = opt.size || 10000;
        this.enabled = opt.enabled || false;
        const loader = new TextureLoader();
        loader.crossOrigin = '';
        const grassTexture = loader.load('/assets/grass/blade_diffuse.jpg');
        const alphaMap = loader.load('/assets/grass/blade_alpha.jpg');
        const noiseTexture = loader.load('/assets/grass/perlinFbm.jpg');


        const joints = 4;
        const bladeWidth = 0.12;
        const bladeHeight = 1;
        const pos = new Vector2(0.01, 0.01);
        const elevation = 0.2;
        const azimuth = 0.4;
        const ambientStrength = 0.7;
        const translucencyStrength = 1.5;
        const specularStrength = 0.5;
        const diffuseStrength = 1.5;
        const shininess = 256;

        const sunColour = new Vector3(1.0, 1.0, 1.0);
        const specularColour = new Vector3(1.0, 1.0, 1.0);

        //Number of vertices on ground plane side
        const resolution = 64;
        //Distance between two ground plane vertices
        const delta = this.size/resolution;

        this.grassMaterial = new RawShaderMaterial({
            uniforms: {
                time: { type: 'float', value: 0 } as IUniform,
                delta: { type: 'float', value: delta } as IUniform,
                posX: { type: 'float', value: pos.x } as IUniform,
                posZ: { type: 'float', value: pos.y } as IUniform,
                width: { type: 'float', value: this.size } as IUniform,
                map: { value: grassTexture },
                alphaMap: { value: alphaMap },
                noiseTexture: { value: noiseTexture },
                sunDirection: { type: 'vec3', value: new Vector3(Math.sin(azimuth), Math.sin(elevation), -Math.cos(azimuth)) } as IUniform,
                cameraPosition: { type: 'vec3', value: new Vector3(0,50,0) } as IUniform,
                ambientStrength: { type: 'float', value: ambientStrength } as IUniform,
                translucencyStrength: { type: 'float', value: translucencyStrength } as IUniform,
                diffuseStrength: { type: 'float', value: diffuseStrength } as IUniform,
                specularStrength: { type: 'float', value: specularStrength } as IUniform,
                shininess: { type: 'float', value: shininess } as IUniform,
                lightColour: { type: 'vec3', value: sunColour } as IUniform,
                specularColour: { type: 'vec3', value: specularColour } as IUniform,
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: DoubleSide
        });


        //Define base geometry that will be instanced. We use a plane for an individual blade of grass
        const grassBaseGeometry = new PlaneGeometry(bladeWidth, bladeHeight, 1, joints);
        grassBaseGeometry.translate(0, bladeHeight/2, 0);

        //Define the bend of the grass blade as the combination of three quaternion rotations
        let vertex = new Vector3();
        let quaternion0 = new Quaternion();
        let quaternion1 = new Quaternion();
        let x, y, z, w, angle, sinAngle, rotationAxis;

        //Rotate around Y
        angle = 0.05;
        sinAngle = Math.sin(angle / 2.0);
        rotationAxis = new Vector3(0, 1, 0);
        x = rotationAxis.x * sinAngle;
        y = rotationAxis.y * sinAngle;
        z = rotationAxis.z * sinAngle;
        w = Math.cos(angle / 2.0);
        quaternion0.set(x, y, z, w);

        //Rotate around X
        angle = 0.3;
        sinAngle = Math.sin(angle / 2.0);
        rotationAxis.set(1, 0, 0);
        x = rotationAxis.x * sinAngle;
        y = rotationAxis.y * sinAngle;
        z = rotationAxis.z * sinAngle;
        w = Math.cos(angle / 2.0);
        quaternion1.set(x, y, z, w);

        //Combine rotations to a single quaternion
        quaternion0.multiply(quaternion1);

        //Rotate around Z
        angle = 0.1;
        sinAngle = Math.sin(angle / 2.0);
        rotationAxis.set(0, 0, 1);
        x = rotationAxis.x * sinAngle;
        y = rotationAxis.y * sinAngle;
        z = rotationAxis.z * sinAngle;
        w = Math.cos(angle / 2.0);
        quaternion1.set(x, y, z, w);

        //Combine rotations to a single quaternion
        quaternion0.multiply(quaternion1);

        let quaternion2 = new Quaternion();

        //Bend grass base geometry for more organic look
        for (let v = 0; v < grassBaseGeometry.attributes.position.array.length; v += 3){
            quaternion2.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
            vertex.x = grassBaseGeometry.attributes.position.array[v];
            vertex.y = grassBaseGeometry.attributes.position.array[v+1];
            vertex.z = grassBaseGeometry.attributes.position.array[v+2];
            let frac = vertex.y/bladeHeight;
            quaternion2.slerp(quaternion0, frac);
            vertex.applyQuaternion(quaternion2);
            grassBaseGeometry.attributes.position.array[v] = vertex.x;
            grassBaseGeometry.attributes.position.array[v+1] = vertex.y;
            grassBaseGeometry.attributes.position.array[v+2] = vertex.z;
        }

        grassBaseGeometry.computeVertexNormals();
        const baseMaterial = new MeshNormalMaterial({ side: DoubleSide });
        const baseBlade = new Mesh(grassBaseGeometry, baseMaterial);

        const instancedGeometry = new InstancedBufferGeometry();
        instancedGeometry.index = grassBaseGeometry.index;
        instancedGeometry.attributes.position = grassBaseGeometry.attributes.position;
        instancedGeometry.attributes.uv = grassBaseGeometry.attributes.uv;
        instancedGeometry.attributes.normal = grassBaseGeometry.attributes.normal;
        this.geometry = instancedGeometry;

    }

    getFromScene() {
        return this.scene.children.find(mesh => mesh.name === 'grass');
    }

    regenerateGrassCoordinates() {
        // Each instance has its own data for position, orientation and scale
        const indices = [];
        const offsets = [];
        const scales = [];
        const halfRootAngles = [];
        let x,y,z;

        //For each instance of the grass blade
        for (let i = 0; i < this.instances; i++){

            indices.push(i/this.instances);

            //Offset of the roots
            x = Math.random() * this.size - this.size/2;
            z = Math.random() * this.size - this.size/2;
            y = 0;
            offsets.push(x, y, z);

            //Random orientation
            let angle = Math.PI - Math.random() * (2 * Math.PI);
            halfRootAngles.push(Math.sin(0.5*angle), Math.cos(0.5*angle));

            //Define variety in height
            if (i % 3 != 0){
                scales.push(2.0+Math.random() * 1.25);
            } else {
                scales.push(2.0+Math.random());
            }
        }

        const offsetAttribute = new InstancedBufferAttribute(new Float32Array(offsets), 3);
        const scaleAttribute = new InstancedBufferAttribute(new Float32Array(scales), 1);
        const halfRootAngleAttribute = new InstancedBufferAttribute(new Float32Array(halfRootAngles), 2);
        const indexAttribute = new InstancedBufferAttribute(new Float32Array(indices), 1);

        this.geometry.setAttribute('offset', offsetAttribute);
        this.geometry.setAttribute('scale', scaleAttribute);
        this.geometry.setAttribute('halfRootAngle', halfRootAngleAttribute);
        this.geometry.setAttribute('index', indexAttribute);
    }

    addToScene() {
        const grass = this.getFromScene();
        if (grass) {
            this.scene.remove(grass);
        }
        this.regenerateGrassCoordinates();
        this.mesh = new Mesh(this.geometry, this.grassMaterial)
        this.mesh.castShadow = true;
        this.mesh.name = "grass";
        this.mesh.position.set(this.size / 2, 0, this.size / 2);

        this.scene.add(this.mesh);
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

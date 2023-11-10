import {Clock, DoubleSide, InstancedMesh, Matrix4, PlaneGeometry, Scene, ShaderMaterial} from "three";
import {Object3D} from "three/src/core/Object3D";

const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  
    // NOISE
    float N (vec2 st) {
        return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
    }
    
    float smoothNoise( vec2 ip ){
        vec2 lv = fract( ip );
      vec2 id = floor( ip );
      
      lv = lv * lv * ( 3. - 2. * lv );
      
      float bl = N( id );
      float br = N( id + vec2( 1, 0 ));
      float b = mix( bl, br, lv.x );
      
      float tl = N( id + vec2( 0, 1 ));
      float tr = N( id + vec2( 1, 1 ));
      float t = mix( tl, tr, lv.x );

      float strength = 2.0;
      return mix( b, t, lv.y ) * strength;
    }
  
	void main() {

    vUv = uv;
    float t = time * 2.;
    
    // VERTEX POSITION
    
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif
    
    // DISPLACEMENT
    
    float noise = smoothNoise(mvPosition.xy * 0.5 + vec2(0., t));
    noise = pow(noise * 0.5 + 0.5, 2.) * 2.;
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1. - cos( uv.y * 3.1416 * 0.5 );
    
    float displacement = noise * ( 0.3 * dispPower );
    mvPosition.y -= displacement;
    
    //
    
    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

	}
`;

const fragmentShader = `
  varying vec2 vUv;
  
  void main() {
  	vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
    float clarity = ( vUv.y * 0.875 ) + 0.125;
    gl_FragColor = vec4( baseColor * clarity, 1 );
  }
`;

const uniforms = {
    time: {
        value: 0
    }
}


interface GrassOptions {
    instances?: number,
    width?: number,
    height?: number
}
export class Grass {
    private clock: Clock;
    private readonly instances: number;
    private scene: Scene;
    //private readonly geometry: BufferGeometry;
    private readonly leavesMaterial: ShaderMaterial;
    private width: number;
    private height: number;

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

    addToScene() {
        const grass = this.scene.children.find(mesh => mesh.name === 'grass');
        if (grass) {
            this.scene.remove(grass);
        }

        const geometry = new PlaneGeometry( 1, 10, 2, 4 );
        geometry.translate( 0, 0.5, 0 );

        const instancedMesh = new InstancedMesh(geometry, this.leavesMaterial, this.instances);
        instancedMesh.name = "grass";
        this.scene.add( instancedMesh );
        const temp = new Object3D();
        const rotationMatrix = new Matrix4(); // Create a rotation matrix

        for ( let i=0 ; i< this.instances ; i++ ) {
            temp.position.set(
                (Math.random()) * this.width ,
                4,
                (Math.random()) * this.height
            );

            temp.scale.setScalar( 0.5 + Math.random() * 0.5 );
            temp.rotation.y = Math.random() * Math.PI;
            //temp.rotation.z = Math.random() * Math.PI;
            temp.updateMatrix();

            rotationMatrix.makeRotationX(-Math.PI / 2); // Rotate around the X-axis

            temp.matrix.multiplyMatrices(rotationMatrix, temp.matrix);


            //temp.updateMatrix();
            instancedMesh.setMatrixAt( i, temp.matrix );
        }

    }

    refresh() {
        this.leavesMaterial.uniforms.time.value = this.clock.getElapsedTime();
        this.leavesMaterial.uniformsNeedUpdate = true;
    }
}


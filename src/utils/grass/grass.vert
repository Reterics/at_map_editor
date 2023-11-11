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

    float displacement = noise * ( 0.5 * dispPower );
    mvPosition.y -= displacement;

    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

}
import React, {useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import {AssetObject, Circle} from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, scene: THREE.Scene, controls: OrbitControls;

export default function ThreeComponent({
    items,
    height,
    width
}: {
    items: AssetObject[],
    height: number,
    width: number
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    const refreshScene = () => {
        if (scene) {
            scene.clear();
        }
        items.forEach(item => {
            let model;
            let material;
            let geometry;
            switch (item.type) {
                case "rect":
                    geometry = new THREE.BoxGeometry();
                    material = new THREE.MeshBasicMaterial({ color: 0x0fffff });
                    break;
                case "circle":
                    geometry = new THREE.SphereGeometry((item as Circle).radius, 32, 16 );
                    material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
            }
            model = new THREE.Mesh(geometry, material);
            if (model && typeof item.x === 'number' && typeof item.y === "number") {
                model.position.set(item.x, item.y, 0);
            }
            if (model && scene) {
                scene.add(model);
            }
        })
    };

    const loadTHREEComponent = () => {
        if (typeof window !== 'undefined') {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            renderer.setSize(width, height);
            while (containerRef.current?.childNodes.length) {
                containerRef.current?.removeChild(containerRef.current?.childNodes[0]);
            }
            containerRef.current?.appendChild(renderer.domElement);
            camera.up.set(0, -1, 0);
            refreshScene();

            renderer.render(scene, camera);
            controls = new OrbitControls( camera, renderer.domElement );

            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };


            animate();

            setLoaded(true);
            // Clean up the event listener when the component is unmounted
            return () => {};
        }
    };

    useEffect(loadTHREEComponent, []);

    if (scene && scene.children.length < items.length) {
        refreshScene();
    }

    if (loaded && camera && renderer) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);

        const lookAt = new THREE.Vector3(Math.round(width/2), Math.round(height/2), 0);
        camera.position.copy(lookAt);
        camera.position.z = - Math.round(Math.max(height, width) * 3 / 4);
        controls.target.copy(lookAt);
        renderer.render(scene, camera);
    }

    return <div ref={containerRef}/>;
}
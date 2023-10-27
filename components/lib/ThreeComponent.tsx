import React, {useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import {AssetObject} from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, scene: THREE.Scene;

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

            }
            model = new THREE.Mesh(geometry, material);
            if (model && typeof item.x === 'number' && typeof item.y === "number") {
                model.position.set(item.x, 0, item.y);
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
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(width, height);
            while (containerRef.current?.childNodes.length) {
                containerRef.current?.removeChild(containerRef.current?.childNodes[0]);
            }
            containerRef.current?.appendChild(renderer.domElement);
            camera.position.z = 70;
            camera.position.x = 130;
            camera.position.y = 250;

            refreshScene();

            renderer.render(scene, camera);
            const controls = new OrbitControls( camera, renderer.domElement );

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
    }

    return <div ref={containerRef}/>;
}
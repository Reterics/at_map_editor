import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {AssetObject} from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function ThreeComponent({
    items
}: {
    items: AssetObject[]
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene>(new THREE.Scene());

    const refreshScene = () => {
        sceneRef.current.clear();
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
            if (model) {
                sceneRef.current.add(model);
            }
        })
    };

    const loadTHREEComponent = () => {
        if (typeof window !== 'undefined') {
            const scene = sceneRef.current;
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
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


            const handleResize = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();

                renderer.setSize(width, height);
            };

            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };


            window.addEventListener('resize', handleResize);
            animate();


            // Clean up the event listener when the component is unmounted
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    };

    useEffect(loadTHREEComponent, []);

    if (sceneRef.current.children.length < items.length) {
        refreshScene();
    }

    return <div ref={containerRef} />;
}
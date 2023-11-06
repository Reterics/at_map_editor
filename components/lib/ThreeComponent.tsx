import React, {useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import {AssetObject, Circle, Line, Rectangle} from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene, controls: OrbitControls;

export default function ThreeComponent({
    items,
    height,
    width,
    selected,
    setItems
}: {
    items: AssetObject[],
    selected?: AssetObject
    height: number,
    width: number,
    setItems:Function,
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    let arrowHelpers: THREE.Group;
    let helpersCount = 0;

    const updateCameraPosition = () => {
        if (camera && renderer) {
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);

            const lookAt = new THREE.Vector3(Math.round(width/2), Math.round(height/2), 0);
            camera.position.copy(lookAt);
            camera.position.z = - Math.round(Math.max(height, width) * 3 / 4);
            controls.target.copy(lookAt);
            renderer.render(scene, camera);
        }
    }

    const refreshScene = () => {
        if (scene) {
            scene.clear();
        }
        items.forEach((item, index) => {
            let model;
            let material = new THREE.MeshBasicMaterial({ color: item.color ?
                    new THREE.Color(item.color) : 0xffffff });
            let geometry;
            let position1, position2;
            switch (item.type) {
                case "rect":
                    const rect = item as Rectangle;
                    geometry = new THREE.BoxGeometry(rect.w, rect.h, Math.round((rect.w + rect.h) / 2));
                    break;
                case "circle":
                    geometry = new THREE.SphereGeometry((item as Circle).radius, 32, 16 );
                    break;
                case "line":
                    const line = item as Line;
                    position1 = new THREE.Vector3(line.x1, line.y1, 0);
                    position2 = new THREE.Vector3(line.x2, line.y2, 0);
                    const height = position1.distanceTo(position2);

                    geometry = new THREE.CylinderGeometry( 5, 5, height, 32 );
            }
            model = new THREE.Mesh(geometry, material);
            model.name = "mesh_" + index;
            if (model && position1 && position2) {
                const positionMid = new THREE.Vector3();
                positionMid.addVectors(position1, position2).multiplyScalar(0.5);
                model.position.copy(positionMid);
                const direction = new THREE.Vector3();
                direction.subVectors(position2, position1).normalize();

                const quaternion = new THREE.Quaternion();
                quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
                model.setRotationFromQuaternion(quaternion);
            } else if (model && item.type === "rect") {
                const rect = item as Rectangle;
                model.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2, 0);
            } else if (model && typeof item.x === 'number' && typeof item.y === "number") {
                model.position.set(item.x, item.y, 0);
            }
            if (model && scene) {
                scene.add(model);
            }
        });
    };

    const loadTHREEComponent = () => {
        if (typeof window !== 'undefined') {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
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

            updateCameraPosition();
            animate();

            setLoaded(true);

            if (process.env.NODE_ENV === "development") {
                window.AT_Editor = window.AT_Editor || {};
                window.AT_Editor.scene = scene;
                window.AT_Editor.camera = camera;
                window.AT_Editor.renderer = renderer;
            }
            // Clean up the event listener when the component is unmounted
            return () => {};
        }
    };

    const addArrowHelper = ()=>{
        const arrowGroup = new THREE.Group();
        arrowGroup.name = "arrows";
        const xAxisDirection = new THREE.Vector3(1, 0, 0);
        const yAxisDirection = new THREE.Vector3(0, 1, 0);
        const zAxisDirection = new THREE.Vector3(0, 0, 1);

        const origin = new THREE.Vector3( 0, 0, 0 );
        const length = 100;

        const xAxisArrow = new THREE.ArrowHelper(xAxisDirection, origin, length, 0xff0000);
        const yAxisArrow = new THREE.ArrowHelper(yAxisDirection, origin, length, 0x00ff00);
        const zAxisArrow = new THREE.ArrowHelper(zAxisDirection, origin, length, 0x0000ff);

        arrowGroup.add(xAxisArrow);
        arrowGroup.add(yAxisArrow);
        arrowGroup.add(zAxisArrow);

        scene.add(arrowGroup);

        if (process.env.NODE_ENV === "development") {
            window.AT_Editor = window.AT_Editor || {};
            window.AT_Editor.arrows = arrowGroup;
        }
    }

    const updateArrowHelper = ()=>{
        if (scene && scene.children && selected) {
            if (!arrowHelpers) {
                addArrowHelper();
                arrowHelpers = scene.children.find(mesh => mesh instanceof THREE.Group &&
                    mesh.name === "arrows") as THREE.Group
            }
            if (arrowHelpers) {
                if (selected.type === "line") {
                    const line = selected as Line,
                        position1 = new THREE.Vector3(line.x1, line.y1, 0),
                        position2 = new THREE.Vector3(line.x2, line.y2, 0);
                    const positionMid = new THREE.Vector3();
                    positionMid.addVectors(position1, position2).multiplyScalar(0.5);
                    arrowHelpers.position.copy(positionMid);
                    arrowHelpers.visible = true;

                } else if (selected.type === "rect") {
                    const rect = selected as Rectangle;
                    arrowHelpers.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2, 0);
                    arrowHelpers.visible = true;

                } else if (typeof selected.x === "number" && typeof selected.y === "number") {
                    arrowHelpers.position.set(selected.x, selected.y, 0);
                    arrowHelpers.visible = true;

                } else {
                    arrowHelpers.visible = false;
                }
            }
        } else if (!selected && arrowHelpers) {
            arrowHelpers.visible = false;
        }
    }

    const onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent> ) => {
        event.preventDefault();

        if (camera && scene && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();

            const mouse = new THREE.Vector2();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const rayCaster = new THREE.Raycaster();
            rayCaster.setFromCamera(mouse, camera);
            const intersects = rayCaster.intersectObjects(scene.children, true);

            if ( intersects.length > 0 ) {
                console.log(intersects)
                const mesh = intersects.find(mesh => mesh.object.name
                    && mesh.object.name.startsWith("mesh_"));
                if (mesh) {
                    const index = Number(mesh.object.name.replace("mesh_", ""));

                    if (items[index]) {
                        const updatedItems = items.map((item, i) => {
                            item.selected = i === index;
                            return item;
                        });
                        setItems([...updatedItems]);
                    }
                }
            }
        }
    };

    if (scene) {
        arrowHelpers =
            scene.children.find(mesh => mesh instanceof THREE.Group &&
                mesh.name === "arrows") as THREE.Group;
        if (arrowHelpers) {
            helpersCount++;
        }
    }
    useEffect(loadTHREEComponent, [height, width]);

    if (scene && scene.children.length - helpersCount < items.length) {
        refreshScene();
    }

    if (loaded && camera && renderer && camera.aspect !== width / height) {
        camera.aspect = width / height;
        updateCameraPosition();
    }

    updateArrowHelper();

    return <div ref={containerRef} onMouseDown={onMouseDown}/>;
}
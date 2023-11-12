"use client";
import React, {useRef, useEffect, useState} from 'react';
import * as THREE from 'three';
import {AssetObject, Circle, Line, Rectangle} from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {Mesh} from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import {ThreeControlType} from "@/src/types/general";
import {Grass} from "@/src/utils/grass/grass";
import {renderEnvironment} from "@/src/utils/background";


// TODO: Move this all to React.useMemo to preserve data over re-renders
let camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene, controls: OrbitControls | TrackballControls,
    shadowObject: THREE.Mesh|null,
    grass: Grass,
    animationID: number|undefined,
    context:  WebGLRenderingContext | WebGL2RenderingContext | undefined;

export default function ThreeComponent({
    items,
    height,
    width,
    selected,
    setItems,
    reference,
    threeControl,
    ground,
    grassEnabled,
    skyEnabled
}: {
    items: AssetObject[],
    selected?: AssetObject
    height: number,
    width: number,
    setItems:Function,
    reference: AssetObject,
    threeControl: ThreeControlType,
    ground: string,
    grassEnabled?: boolean,
    skyEnabled?: boolean
}) {
    console.log('Window: ', typeof window);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    let arrowHelpers: THREE.Group;
    let helpersCount = 0;
    const helperNames = [
        "sky",
        "light",
        "hemisphereLight",
        "grass",
        "arrows",
        "plane"];
    const planeSize = Math.max(width, height, 1000)*10;

    const updateCameraPosition = () => {
        if (camera && renderer) {
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);

            let lookAt;
            switch (threeControl) {
                case "object":
                    if (selected) {
                        const mesh = getMeshForItem(selected);
                        lookAt = mesh.position;
                    } else {
                        lookAt = new THREE.Vector3(Math.round(width/2), Math.round(height/2), 0);
                    }
                    break;
                case "orbit":
                case "trackball":
                default:
                    lookAt = new THREE.Vector3(Math.round(width/2), Math.round(height/2), 0);
            }
            camera.position.copy(lookAt);
            camera.position.z = + Math.round(Math.max(height, width) * 3 / 4);
            camera.position.y = + Math.round(Math.max(height, width) * 3 / 4);
            controls.target.copy(lookAt);
            renderer.render(scene, camera);
        }
    };

    const updateControls = () => {
        switch (threeControl) {
            case "trackball":
                controls = new TrackballControls( camera, renderer.domElement );
                break;
            case "orbit":
            case "object":
            default:
                controls = new OrbitControls( camera, renderer.domElement );
                controls.maxPolarAngle = Math.PI / 2;
        }
    }

    const getMeshForItem = (item: AssetObject): THREE.Mesh => {
        let model;
        let material = new THREE.MeshBasicMaterial({ color: item.color ?
                new THREE.Color(item.color) : 0x000000 });
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
            model.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.z || 0);
        } else if (model && typeof item.x === 'number' && typeof item.y === "number") {
            model.position.set(item.x, item.y, item.z || 0);
        }
        return model;
    };

    const refreshSceneItems = () => {
        if (scene) {
            scene.children
                .filter(m=>m.name && m.name.startsWith('mesh_'))
                .forEach((m)=>scene.remove(m));
            //scene.clear();
        }
        items.forEach((item, index) => {
            const model = getMeshForItem(item);

            model.name = "mesh_" + index;
            if (model && scene) {
                scene.add(model);
            }
        });
    };

    const loadTHREEComponent = () => {
        console.log('Load');

        // TODO: No need window check since we have them outside
        if (typeof window !== 'undefined') {
            THREE.Object3D.DEFAULT_UP.set(0, 0, -1);

            scene = scene || new THREE.Scene();
            camera = camera || new THREE.PerspectiveCamera(75, width / height, 0.1, 20001);
            if (!renderer) {
                renderer = new THREE.WebGLRenderer({
                    antialias: true
                });
                context = renderer.getContext();

                context.canvas.addEventListener("webglcontextlost", (e) => {
                    e.preventDefault();
                    console.warn("Context Lost, cancel rendering: ", animationID);
                    if (typeof animationID === "number") {
                        cancelAnimationFrame(animationID);
                    }
                }, false);
                context.canvas.addEventListener("webglcontextrestored", (e) => {
                    e.preventDefault();
                    console.warn("Context Restored");
                }, false);
            }

            renderer.setSize(width, height);
            if (containerRef.current && containerRef.current.childNodes.length > 1) {
                while (containerRef.current?.childNodes.length) {
                    containerRef.current?.removeChild(containerRef.current?.childNodes[0]);
                }
                containerRef.current?.appendChild(renderer.domElement);
            } else if (containerRef.current && !containerRef.current.childNodes.length) {
                containerRef.current?.appendChild(renderer.domElement);
            }

            camera.up.set(0, 0, 1);
            refreshSceneItems();

            renderer.render(scene, camera);
            updateControls();

            // TODO: Where the render should be placed if we are using Memos?
            const animate = () => {
                if (grassEnabled && grass) {
                    grass.refresh();
                }
                controls.update();
                renderer.render(scene, camera);
                animationID = requestAnimationFrame(animate);
            };

            updateCameraPosition();

            if (typeof animationID === "number") {
                console.log("Cancel old animation ", animationID);
                cancelAnimationFrame(animationID);
                animationID = undefined;
            }
            animate();

            setLoaded(true);

            if (process.env.NODE_ENV === "development") {
                window.AT_Editor = window.AT_Editor || {};
                window.AT_Editor.scene = scene;
                window.AT_Editor.camera = camera;
                window.AT_Editor.renderer = renderer;
                window.AT_Editor.controls = controls;
            }
            void addBasePlane().then(() => setEnvironment())
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
                    arrowHelpers.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.z || 0);
                    arrowHelpers.visible = true;

                } else if (typeof selected.x === "number" && typeof selected.y === "number") {
                    arrowHelpers.position.set(selected.x, selected.y, selected.z || 0);
                    arrowHelpers.visible = true;

                } else {
                    arrowHelpers.visible = false;
                }
            }
        } else if (!selected && arrowHelpers) {
            arrowHelpers.visible = false;
        }
    }

    const getMouseIntersects = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (camera && scene && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();

            const mouse = new THREE.Vector2();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const rayCaster = new THREE.Raycaster();
            rayCaster.setFromCamera(mouse, camera);
            return rayCaster.intersectObjects(scene.children.filter(mesh =>
                mesh.name.startsWith("mesh") || mesh.name === "plane"), true);
        }
        return [];
    }

    const onMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault();
        if (reference.type === "cursor") {
            const intersects = getMouseIntersects(event);

            if (intersects.length) {
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
        } else if (reference.type === "circle" || reference.type === "rect") {
            if (shadowObject) {
                switch (reference.type) {
                    case "rect":
                        const boundingBox = new THREE.Box3().setFromObject(shadowObject);
                        const center = new THREE.Vector3();
                        boundingBox.getCenter(center);
                        const w = (shadowObject.geometry as THREE.BoxGeometry).parameters.width;
                        const h = (shadowObject.geometry as THREE.BoxGeometry).parameters.height;
                        const x = shadowObject.position.x - w / 2;
                        const y = shadowObject.position.y - h / 2;

                        setItems([...items, {...reference,
                            x: x,
                            y: y,
                            w: w,
                            h: h,
                            z: shadowObject.position.z
                        }]);
                        break;
                    case "circle":
                        setItems([...items, {...reference,
                            x: shadowObject.position.x,
                            y: shadowObject.position.y,
                            z: shadowObject.position.z,
                            radius: (shadowObject.geometry as THREE.SphereGeometry).parameters.radius
                        }]);
                }
                scene.remove(shadowObject);
                shadowObject = null;
            }
        }

    };

    const addBasePlane = () => {
        return new Promise(resolve => {
            if (!scene || scene.children.find(mesh => mesh.name === "plane")) {
                return resolve(false);
            }
            const geometry = new THREE.PlaneGeometry( planeSize, planeSize );
            const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
            const loader = new THREE.TextureLoader();
            loader.load(ground ,
                function ( texture ) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.offset.set( 0, 0 );
                    texture.repeat.set( 2, 2 );
                    material.map = texture;
                    material.needsUpdate = true;
                    const plane = new THREE.Mesh( geometry, material );
                    //plane.position.setX(planeSize / 2);
                    //plane.position.setY(planeSize / 2);
                    plane.position.setZ(-1);
                    plane.name = "plane";
                    scene.add( plane );
                    resolve(plane);
                });
        });
    };

    const setEnvironment = () => {
        if (grassEnabled) {
            if (grass && !grass.getFromScene()) {
                grass.addToScene();
            } else if (!grass) {
                grass = new Grass(scene,{
                    instances: 1000000,
                    width: planeSize,
                    height: planeSize
                });
                grass.addToScene();
            } else {
                grass.setDimensions(planeSize, planeSize)
            }
        }
        if (skyEnabled) {
            renderEnvironment(scene);
        }
    }

    if (scene) {
        arrowHelpers =
            scene.children.find(mesh => mesh instanceof THREE.Group &&
                mesh.name === "arrows") as THREE.Group;

        scene.children.forEach((mesh) => {
            if (helperNames.includes(mesh.name)) {
                helpersCount++;
            }
        });
    }

    if (shadowObject) {
        helpersCount++;
        const inScene = scene.children.find(mesh=>mesh.name === "shadowObject");
        if (!inScene) {
            scene.add(shadowObject);
        }
    }
    useEffect(loadTHREEComponent, [height, width]);

    if (scene && scene.children.length - helpersCount < items.length) {
        refreshSceneItems();
        void addBasePlane().then(() => setEnvironment())
    }

    if (loaded && camera && renderer && camera.aspect !== width / height) {
        camera.aspect = width / height;
        if (grass) {
            grass.setDimensions(planeSize, planeSize);
        }
        updateCameraPosition();
    } else if (controls && threeControl) {
        if ((threeControl === "trackball" && controls instanceof OrbitControls) ||
            (threeControl === "orbit" && controls instanceof TrackballControls) ||
            (threeControl === "object" && controls instanceof TrackballControls)) {
            updateControls();
            updateCameraPosition();
        }
    }
    updateArrowHelper();

    function isCollisionDetected(object1: THREE.Object3D, object2: THREE.Object3D) {
        const box1 = new THREE.Box3().setFromObject(object1);
        const box2 = new THREE.Box3().setFromObject(object2);

        return box1.intersectsBox(box2);
    }

    const onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault();
        if (reference.type === "cursor") {
            return;
        }
        const justCreated = !shadowObject;
        const intersects = getMouseIntersects(event);

        if (intersects.length) {
            const intersect = intersects.find(object => {
                return object.object.name !== "shadowObject" && object.object.isObject3D;
            });
            if (intersect) {
                const point = intersect.point;
                const mainObject = intersect.object as Mesh;
                if (justCreated) {
                    const config = {
                        ...reference,
                        color: "#3cffee",
                    };
                    switch (reference.type) {
                        case "rect":
                            (config as Rectangle).w = 50;
                            (config as Rectangle).h = 50;
                            break;
                        case "circle":
                            (config as Circle).radius = 25;
                            break;
                    }
                    shadowObject = getMeshForItem(config);
                    shadowObject.name = "shadowObject";
                    (shadowObject.material as THREE.MeshBasicMaterial).opacity = 0.5;
                    (shadowObject.material as THREE.MeshBasicMaterial).needsUpdate = true;
                }

                if (shadowObject) {
                    const movementSpeed = 3; // Adjust the speed as needed
                    shadowObject.position.copy(camera.position)
                    const direction = point.clone().sub(shadowObject.position);
                    direction.normalize();

                    const directionVector = direction.multiplyScalar(movementSpeed);
                    let i = 0;
                    while (!isCollisionDetected(shadowObject, mainObject)) {
                        shadowObject.position.add(directionVector);
                        i++;
                        if (i >= 1000) {
                            break;
                        }
                    }

                    if (justCreated) {
                        scene.add(shadowObject);
                    }
                }
            }
        }
    };

    const onMouseOut = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault();
        if (shadowObject) {
            scene.remove(shadowObject);
            shadowObject = null;
        }
    };

    return <div ref={containerRef}
                onClick={(e)=> reference.type === "cursor" ? onMouseDown(e) : null}
                onDoubleClick={onMouseDown}
                onMouseOver={onMouseMove}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
    />;
}
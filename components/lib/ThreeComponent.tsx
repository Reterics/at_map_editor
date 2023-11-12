"use client";
import React, {useRef, useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {AssetObject, Line, Rectangle } from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Mesh, Scene } from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { ThreeControlType } from "@/src/types/general";
import { Grass } from "@/src/utils/grass/grass";
import { renderEnvironment } from "@/src/utils/background";
import {
    createShadowObject,
    getArrowHelper,
    getControls,
    getGroundPlane,
    getMeshForItem,
    setInitialCameraPosition
} from "@/src/utils/model";
import { Object3D } from "three/src/core/Object3D";
import {useWindow} from "@/src/utils/react";

let animationID: number|undefined;

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
    const containerRef = useRef<HTMLDivElement>(null),
        planeSize = Math.max(width, height, 1000)*10,
        helperNames = [
            "sky",
            "light",
            "hemisphereLight",
            "grass",
            "arrows",
            "plane",
            "shadowObject"
        ]

    let arrowHelpers: THREE.Group,
        helpersCount = 0;
    const addBasePlane = async (scene: Scene) => {
        if (!scene || scene.children.find(mesh => mesh.name === "plane")) {
            return false;
        }
        const plane = await getGroundPlane(planeSize, planeSize, ground);
        scene.add(plane);
        return plane;
    };


    const initializeThreeGlobals = () => {
        // I am using globals, to keep THREE JS references intact. useMemo and useRef did not work properly in fast-render mode
        window.AT_Editor = window.AT_Editor || {};
        if (window.AT_Editor.scene && window.AT_Editor.camera && window.AT_Editor.renderer) {
            return {
                camera:window.AT_Editor.camera,
                renderer: window.AT_Editor.renderer,
                scene: window.AT_Editor.scene,
                grass: window.AT_Editor.grass
            }
        }
        // Set Globals
        THREE.Object3D.DEFAULT_UP.set(0, 0, -1);

        const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 20001),
            renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
                antialias: true
            }),
            context:  WebGLRenderingContext | WebGL2RenderingContext | undefined = renderer.getContext(),
            scene: THREE.Scene = new THREE.Scene(),
            grass: Grass|undefined = grassEnabled ? new Grass(scene,{
                instances: 1000000,
                width: planeSize,
                height: planeSize
            }) : undefined;

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

        renderer.setSize(width, height);
        camera.up.set(0, 0, 1);
        if (grass) {
            grass.addToScene();
        }
        if (skyEnabled) {
            renderEnvironment(scene);
        }
        renderer.render(scene, camera);

        void addBasePlane(scene);

        const shadowObject = createShadowObject(reference);
        scene.add(shadowObject);
        window.AT_Editor.scene = scene;
        window.AT_Editor.camera = camera;
        window.AT_Editor.renderer = renderer;
        window.AT_Editor.grass = grass;
        return {camera, renderer, scene, grass}
    }

    const {
        camera,
        renderer,
        scene,
        grass
    } = useWindow(initializeThreeGlobals, [
        "camera",
        "renderer",
        "scene",
        "grass"
    ]);

    const controls: TrackballControls | OrbitControls =
        useWindow(function (this: TrackballControls | OrbitControls | undefined) {
            if (this) {
                this?.dispose();
            }
            return getControls(threeControl, camera, renderer);
        },
        "controls", threeControl);

    const shadowObject: Mesh|null|undefined = scene.children.find((mesh: Object3D)=>
        mesh.name === "shadowObject") as Mesh|undefined;

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

    useEffect(()=> {
        if (scene) {
            scene.children
                .filter((m: Object3D)=>m.name && m.name.startsWith('mesh_'))
                .forEach((m: Object3D)=>scene.remove(m));
            //scene.clear();
        }
        items.forEach((item, index) => {
            const model = getMeshForItem(item);

            model.name = "mesh_" + index;
            if (model && scene) {
                scene.add(model);
            }
        });
    }, [items, scene])


    const cancelAnimation = () => {
        if (typeof animationID === "number") {
            console.log("Cancel old animation ", animationID);
            cancelAnimationFrame(animationID);
            animationID = undefined;
        }
    };

    useEffect(() => {
        if (containerRef.current && containerRef.current.childNodes.length > 1) {
            while (containerRef.current?.childNodes.length) {
                containerRef.current?.removeChild(containerRef.current?.childNodes[0]);
            }
            containerRef.current?.appendChild(renderer.domElement);
        } else if (containerRef.current && !containerRef.current.childNodes.length) {
            containerRef.current?.appendChild(renderer.domElement);
        }
        const animate = () => {
            if (grass) {
                grass.refresh();
            }
            controls.update();
            renderer.render(scene, camera);
            animationID = requestAnimationFrame(animate);
        };

        cancelAnimation();
        animate();

        // Clean up the event listener when the component is unmounted
        return () => {};
    }, [camera, controls, renderer, scene]);

    useEffect(()=>{
        setInitialCameraPosition(
            camera,
            renderer,
            controls,
            scene,
            width,
            height,
            threeControl,
            selected);
    }, [camera, renderer, controls, threeControl])

    const addArrowHelper = ()=>{
        const arrowGroup = getArrowHelper();

        scene.add(arrowGroup);
    }

    const updateArrowHelper = ()=>{
        if (scene && scene.children && selected) {
            if (!arrowHelpers) {
                addArrowHelper();
                arrowHelpers = scene.children.find((mesh: Object3D) => mesh instanceof THREE.Group &&
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
            return rayCaster.intersectObjects(scene.children.filter((mesh: Object3D) =>
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

                shadowObject.position.z = -100;

            }
        }
    };

    if (scene) {
        arrowHelpers =
            scene.children.find((mesh: Object3D) => mesh instanceof THREE.Group &&
                mesh.name === "arrows") as THREE.Group;

        scene.children.forEach((mesh: Object3D) => {
            if (helperNames.includes(mesh.name)) {
                helpersCount++;
            }
        });
    }

    if (camera && renderer && camera.aspect !== width / height) {
        camera.aspect = width / height;
        if (grass) {
            grass.setDimensions(planeSize, planeSize);
        }
        updateCameraPosition();
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
        const intersects = getMouseIntersects(event);

        if (intersects.length) {
            const intersect = intersects.find(object => {
                return object.object.name !== "shadowObject" && object.object.isObject3D;
            });
            if (intersect) {
                const point = intersect.point;
                const mainObject = intersect.object as Mesh;
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
                }
            }
        }
    };

    const onMouseOut = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault();
        if (shadowObject) {
            shadowObject.position.z = -100;
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
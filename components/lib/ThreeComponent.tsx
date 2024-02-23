"use client";
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {AssetObject, Line, Rectangle, RenderedPlane, ShadowType, WaterConfig} from "@/src/types/assets";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Color, Mesh, Scene } from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { ThreeControlType } from "@/src/types/general";
import { Grass } from "@/src/utils/grass/grass";
import { renderEnvironment } from "@/src/utils/background";
import {
    createShadowObject,
    getArrowHelper,
    getControls,
    getGroundPlane,
    getMeshForItem, getWater, isCollisionDetected,
    setInitialCameraPosition
} from "@/src/utils/model";
import { Object3D } from "three/src/core/Object3D";
import { useWindow } from "@/src/utils/react";
import { FPSController } from "@/src/utils/controls/FPSController";

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
    heightMap,
    water,
    grassEnabled,
    skyEnabled,
    assets,
    selectAsset
}: {
    items: AssetObject[],
    selected?: AssetObject
    height: number,
    width: number,
    setItems:Function,
    reference: AssetObject,
    threeControl: ThreeControlType,
    ground: string,
    heightMap?: string,
    water?: string,
    grassEnabled?: boolean,
    skyEnabled?: boolean,
    assets: AssetObject[],
    selectAsset: Function
}) {
    const containerRef = useRef<HTMLDivElement>(null),
        planeSize = 1000, // Map size is 1000x1000x1000 by AnotherTry standard
        helperNames = [
            "sky",
            "light",
            "ambientLight",
            "grass",
            "arrows",
            "plane",
            "shadowObject",
            "hud-2d"
        ],
        clock = new THREE.Clock(true);

    let arrowHelpers: THREE.Group,
        helpersCount = 0;
    const addBasePlane = async (scene: Scene) => {
        if (!scene || scene.children.find(mesh => mesh.name === "plane")) {
            return false;
        }
        const plane = await getGroundPlane(planeSize, planeSize, ground, heightMap);
        scene.add(plane);
        return plane;
    };


    const initializeThreeGlobals = () => {

        const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 20001),
            renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
                antialias: true
            }),
            context:  WebGLRenderingContext | WebGL2RenderingContext | undefined = renderer.getContext(),
            scene: THREE.Scene = new THREE.Scene(),
            grass: Grass|undefined = new Grass(scene,{
                instances: 1000000,
                width: planeSize,
                height: planeSize,
                enabled: grassEnabled
            });

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

        console.log(width, height);
        renderer.setSize(width, height);
        if (grass) {
            grass.addToScene();
        }
        if (skyEnabled) {
            renderEnvironment(scene);
        }
        renderer.render(scene, camera);

        void addBasePlane(scene);
        return { camera, renderer, scene, grass }
    }

    const {
        camera,
        renderer,
        scene,
        grass
    }: {
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        grass: Grass|undefined
    } = useWindow(initializeThreeGlobals, [
        "camera",
        "renderer",
        "scene",
        "grass"
    ]);

    const controls: TrackballControls | OrbitControls | FPSController =
        useWindow(function (this: TrackballControls | OrbitControls | FPSController | undefined) {
            if (this) {
                this?.dispose();
            }
            return getControls(threeControl, camera, renderer, scene);
        },
        "controls", threeControl);

    if (controls instanceof FPSController) {
        controls.assets = assets;
        controls.reference = reference
    }

    let shadowObject: ShadowType|undefined = scene.children.find((mesh: Object3D)=>
        mesh.name === "shadowObject") as ShadowType|undefined;

    const updateShadowReference = async () => {
        if (shadowObject && shadowObject.refType !== reference.type) {
            // Remove ShadowObject and Recreate it
            scene.remove(shadowObject);
            const mesh = await createShadowObject(reference);
            scene.add(mesh);
            shadowObject = scene.children.find((mesh: Object3D)=>
                mesh.name === "shadowObject") as ShadowType|undefined;
        } else if (!shadowObject) {
            const mesh = await createShadowObject(reference);
            scene.add(mesh);
            shadowObject = scene.children.find((mesh: Object3D)=>
                mesh.name === "shadowObject") as ShadowType|undefined;
        }

        if (shadowObject && shadowObject.material) {
            const shadowObjectMaterial = shadowObject.material as THREE.MeshBasicMaterial;
            shadowObjectMaterial.color = new Color(reference.color || '#ffffff');
            shadowObjectMaterial.opacity = 0.5;
            shadowObjectMaterial.needsUpdate = true;
        }
        return shadowObject;
    }

    void updateShadowReference();


    const updateCameraPosition = () => {
        if (camera && renderer) {
            void setInitialCameraPosition(camera,
                renderer,
                controls,
                scene,
                width,
                height,
                threeControl,
                selected);
        }
    };

    const reloadMeshes = async () => {
        if (scene) {
            scene.children
                .filter((m: Object3D)=>m.name && m.name.startsWith('mesh_'))
                .forEach((m: Object3D)=>scene.remove(m));
            //scene.clear();
        }
        for (const item of items) {
            const index = items.indexOf(item);
            const model = await getMeshForItem(item);

            if (model) {
                model.name = "mesh_" + index;
                if (model && scene) {
                    scene.add(model);
                }
            }
        }
    };
    useEffect(()=> {
        void reloadMeshes();
    }, [items, scene]);

    useEffect(() => {
        if (heightMap && scene) {

            const plane = (scene as THREE.Scene).children.find(m => m.name === 'plane') as RenderedPlane;
            if (plane && !plane.isHeightMap) {
                (scene as THREE.Scene).remove(plane);
                void addBasePlane(scene);
            }
        }
    }, [heightMap, scene]);

    useEffect(() => {
        if (water && scene && heightMap) {
            const renderedWater = scene.children.find(m => m.name === 'water') as RenderedPlane;
            getWater(water, planeSize).then(waterMesh => {
                if (renderedWater) {
                    scene.remove(renderedWater);
                }
                scene.add(waterMesh);
            });
        }
    }, [water, scene, heightMap]);


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
            controls.update(clock.getDelta());
            renderer.render(scene, camera);
            animationID = requestAnimationFrame(animate);
        };

        cancelAnimation();
        animate();

        // Clean up the event listener when the component is unmounted
        return () => {};
    }, [camera, controls, renderer, scene]);

    useEffect(()=>{
        void setInitialCameraPosition(
            camera,
            renderer,
            controls,
            scene,
            planeSize,
            planeSize,
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
                        position1 = new THREE.Vector3(line.x1, 0, line.y1),
                        position2 = new THREE.Vector3(line.x2, 0, line.y2);
                    const positionMid = new THREE.Vector3();
                    positionMid.addVectors(position1, position2).multiplyScalar(0.5);
                    arrowHelpers.position.copy(positionMid);
                    arrowHelpers.visible = true;

                } else if (selected.type === "rect") {
                    const rect = selected as Rectangle;
                    const z = rect.z || 0;
                    arrowHelpers.position.set(
                        rect.x + rect.w / 2,
                        z + Math.round((rect.w + rect.h) / 2) / 2,
                        rect.y + rect.h / 2);
                    arrowHelpers.visible = true;

                } else if (typeof selected.x === "number" && typeof selected.y === "number") {
                    arrowHelpers.position.set(selected.x, selected.z || 0, selected.y);
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
                        const x = center.x - w / 2;
                        const y = center.z - h / 2;
                        const z = center.y - Math.round((w + h) / 2) / 2;

                        setItems([...items.map(i=> {i.selected = false; return i}), { ...reference,
                            x: x,
                            y: y,
                            w: w,
                            h: h,
                            z: z,
                            selected: true
                        }]);
                        break;
                    case "circle":
                        const radius = (shadowObject.geometry as THREE.SphereGeometry).parameters.radius || 50
                        setItems([...items.map(i=> {i.selected = false; return i}), { ...reference,
                            x: shadowObject.position.x,
                            y: shadowObject.position.z,
                            z: 1 + radius,
                            radius: radius,
                            selected: true
                        }]);
                }

                shadowObject.position.y = -100;

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
            shadowObject.position.y = -100;
        }
    };

    const lockIfNeeded = () => {
        if (controls instanceof FPSController) {
            controls.lock();
        }
        return true;
    }

    if (grass) {
        grass.isEnabled(grassEnabled);
    }

    return <div ref={containerRef}
                onClick={(e)=> lockIfNeeded() && (reference.type === "cursor" ? onMouseDown(e) : null)}
                onDoubleClick={onMouseDown}
                onMouseOver={onMouseMove}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
    />;
}
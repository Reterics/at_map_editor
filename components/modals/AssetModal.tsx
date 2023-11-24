import { AssetObject } from "@/src/types/assets";
import StyledFile from "@/components/form/StyledFile";
import StyledInput from "@/components/form/StyledInput";
import { ChangeEvent, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadModel, lookAtObject } from "@/src/utils/model";
import { uploadFile, uploadFileDataURL } from "@/src/firebase/storage";
import { getSky } from "@/src/utils/background";

let camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, scene: THREE.Scene;

export default function AssetModal({
    visible,
    onClose,
    currentAsset,
    setCurrentAsset,
    onSave
}: {
    visible: boolean,
    onClose: Function,
    currentAsset: AssetObject,
    setCurrentAsset: Function,
    onSave: Function
}) {
    const [file, setFile] = useState<File|null>(null)
    const containerRef = useRef<HTMLDivElement>(null);

    const reloadPreview = async (file: File) => {
        if (file && containerRef.current) {
            const width = 500,
                height = 250;
            if (!renderer) {
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(75,
                    width / height, 0.1,
                    1000);
                camera.position.x = 5;
                camera.position.y = 5;
                camera.position.z = 5;
                camera.lookAt(new THREE.Vector3(0, 0, 0));

                renderer = new THREE.WebGLRenderer();
                renderer.setSize(width, height);
                renderer.render(scene, camera);
                renderer.setClearColor(new THREE.Color(0xEEEEEE));

                while (containerRef.current?.childNodes.length) {
                    containerRef.current?.removeChild(containerRef.current?.childNodes[0]);
                }
                containerRef.current?.appendChild(renderer.domElement);
                const controls = new OrbitControls(camera, renderer.domElement);
                const animate = () => {
                    requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                };
                animate();
            }

            scene.clear();
            const upColor = 0xFFFF80;
            const downColor = 0x4040FF;
            const light = new THREE.HemisphereLight(upColor, downColor, 1.0);
            scene.add(light);

            const sky = getSky();
            scene.add(sky);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
            scene.add(ambientLight)

            const modelGroup = await loadModel.gltf(file);
            if (modelGroup) {
                lookAtObject(modelGroup, camera);

                scene.add(modelGroup);
                // camera.lookAt(modelGroup.position);
            }

        }
    }
    const handleOnClose = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.id === 'AssetModal') {
            onClose();
        }
    };

    const handleOnChangeFile = (file: File) => {
        setFile(file);
        void reloadPreview(file);
    }

    const changeType = (e: ChangeEvent<HTMLInputElement>, key: string) => {
        const value = e.target.value;
        setCurrentAsset((currentAsset: AssetObject) => {
            const obj = { ...currentAsset };
            // @ts-ignore
            obj[key] = value;
            return obj;
        });
    };

    const uploadAndSave = async () => {
        if (!file) {
            alert('You need to upload a model for creating an asset')
            return;
        }
        if (!renderer || !renderer.domElement) {
            alert('No valid object loaded');
            return;
        }
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        renderer.render(scene,camera);
        const screenshot = renderer.domElement.toDataURL("image/png");
        const assetToSave = {
            ...currentAsset,
            extension: extension,
            path: 'files/' + currentAsset.name + extension,
            screenshot: 'screenshots/' + currentAsset.name + '.png'
        };

        await uploadFileDataURL(assetToSave.screenshot, screenshot);
        await uploadFile(assetToSave.path, file);
        onSave(assetToSave);
    };


    if (!visible) return null;

    return (
        <div
            id="AssetModal"
            onClick={handleOnClose}
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm
            flex justify-center items-center"
        >
            <div className="bg-white p-4 rounded w-[36rem] dark:bg-gray-900">
                <h1 className="font-semibold text-center text-xl text-gray-700 mb-4">
                    Edit Asset
                </h1>

                <form>
                    <StyledInput
                        name="name"
                        label="Name"
                        value={currentAsset.name}
                        onChange={(e) => changeType(e, 'name')}
                    />
                    <StyledFile name="model" label="Model" onChange={handleOnChangeFile} />

                    <div ref={containerRef} className="preview flex justify-center m-auto pt-4 pb-4">

                    </div>
                </form>

                <div className="flex justify-between">
                    <button type="button"
                            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none
                            focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2
                            dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                            onClick={() => uploadAndSave()}
                    >Save
                    </button>
                    <button type="button"
                            className="text-gray-900 bg-white border border-gray-300 focus:outline-none
                            hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg
                            text-sm px-5 py-2.5 mr-2 dark:bg-gray-800 dark:text-white dark:border-gray-600
                            dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                            onClick={() => onClose()}
                    >Cancel
                    </button>

                </div>
            </div>
        </div>
    )
}
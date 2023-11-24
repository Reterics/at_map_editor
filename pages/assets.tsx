import Layout from "@/components/layout";
import { BsFillTrashFill, BsPencilSquare } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import { AssetObject } from "@/src/types/assets";
import { db, firebaseCollections, getCollection } from "@/src/firebase/config";
import AssetModal from "@/components/modals/AssetModal";
import { collection, doc, setDoc } from "firebase/firestore";
import Image from 'next/image'
import { refreshAssets } from "@/src/utils/assets";


export default function Assets() {
    const [assets, setAssets] = useState([] as AssetObject[]);
    const [currentAsset, setCurrentAsset] =
        useState({ type: "model" } as AssetObject);
    const [showNewAsset, setShowNewAsset] = useState(false);

    const deleteAsset = async (id: string|undefined) => {
        if (id && window.confirm('Are you sure you wish to delete this Asset?')) {
            alert('Method is not implemented');
        }
    };

    const editAsset = (asset:AssetObject) => {
        alert('Method is not implemented');
    }

    const saveAsset = async () => {
        const modelRef = doc(collection(db, firebaseCollections.assets))
        await setDoc(modelRef, currentAsset, { merge: true });
        setShowNewAsset(false);
        setCurrentAsset({ type: "model" });
        await refreshAssets(setAssets);
    };


    useEffect(() => {
        void refreshAssets(setAssets);
    }, []);

    return (
        <Layout>
            <div className="flex justify-between max-w-screen-xl m-auto">
                <div />
                <button type="button"
                        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none
                            focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2
                            dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                        onClick={() => setShowNewAsset(true)}
                >
                    Add Asset
                </button>
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-[50px]">
                            ID
                        </th>

                        <th scope="col" className="px-6 py-3 w-[140px]">
                            Image
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 w-[100px]">
                            Action
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {assets.map((asset, index) =>
                        <tr key={index} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">

                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {(asset.id ? asset.id : index+1)}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {(asset.image ? <Image src={asset.image}
                                                       alt="Preview Image"
                                                       width={80}
                                                       height={32}
                                /> : "")}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {(asset.name ? asset.name : "")}
                            </th>

                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {asset.type}
                            </th>
                            <td className="px-6 py-4 flex flex-row text-lg">
                                <BsPencilSquare className="cursor-pointer ml-2" onClick={() => editAsset(asset)}/>
                                <BsFillTrashFill className="cursor-pointer ml-2" onClick={() =>
                                    deleteAsset(asset.id)}/>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            <AssetModal
                visible={showNewAsset}
                onClose={() => setShowNewAsset(false)}
                onSave={() => saveAsset()}
                currentAsset={currentAsset}
                setCurrentAsset={setCurrentAsset}
            />
        </Layout>
    )
}
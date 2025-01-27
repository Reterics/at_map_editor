import Layout from "@/components/layout";
import { BsFillTrashFill, BsPencilSquare } from "react-icons/bs";
import React, { useEffect, useState } from "react";
import { AssetObject } from "@/src/types/assets";
import { db, firebaseCollections } from "@/src/firebase/config";
import AssetModal from "@/components/modals/AssetModal";
import { collection, doc, setDoc } from "firebase/firestore";
import Image from 'next/image'
import { refreshAssets } from "@/src/utils/assets";
import {TableViewActions, TableViewComponent} from "uic-pack";


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

    const saveAsset = async (asset: AssetObject) => {
        const modelRef = doc(collection(db, firebaseCollections.assets))
        await setDoc(modelRef, asset, { merge: true });
        setShowNewAsset(false);
        setCurrentAsset({ type: "model" });
        await refreshAssets(setAssets);
    };


    useEffect(() => {
        void refreshAssets(setAssets);
    }, []);

    const tableLines = assets.map((asset: AssetObject, index) => [
        (asset.id ? asset.id : index+1),
        (asset.image ? <Image src={asset.image}
                              alt="Preview Image"
                              width={80}
                              height={32}
        /> : ""),
        (asset.name ? asset.name : ""),
        asset.type,
        TableViewActions({
            onEdit: () => editAsset(asset),
            onRemove: () => deleteAsset(asset.id),
        })
    ])

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
            <div className="relative overflow-x-auto shadow-md max-w-screen-xl m-auto w-full mt-2">
                <TableViewComponent lines={tableLines} header={[
                    'ID',
                    'Image',
                    'Name',
                    'Type',
                    'Actions'
                ]} />
            </div>
            <AssetModal
                visible={showNewAsset}
                onClose={() => setShowNewAsset(false)}
                onSave={(asset: AssetObject) => saveAsset(asset)}
                currentAsset={currentAsset}
                setCurrentAsset={setCurrentAsset}
            />
        </Layout>
    )
}

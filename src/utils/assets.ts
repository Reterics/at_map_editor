import { firebaseCollections, getCollection } from "@/src/firebase/config";
import { AssetObject } from "@/src/types/assets";
import { getFileURL } from "@/src/firebase/storage";


export const refreshAssets = async (setAssets: Function) => {
    const assets = (await getCollection(firebaseCollections.assets)) as AssetObject[];
    for (let i = 0; i < assets.length; i++) {
        if (assets[i].name && !assets[i].image) {
            assets[i].image = await getFileURL('screenshots/' + assets[i].name + '.png');
        }
    }
    setAssets(assets as AssetObject[]);
};
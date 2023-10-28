import {AssetObject} from "@/src/types/assets";
import StyledFile from "@/components/form/StyledFile";
import StyledInput from "@/components/form/StyledInput";
import {ChangeEvent, useState} from "react";


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
    const handleOnClose = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.id === 'AssetModal') {
            onClose();
        }
    };

    const handleOnChangeFile = (file: File) => {
        setFile(file);
    }

    const changeType = (e: ChangeEvent<HTMLInputElement>, key: string) => {
        const value = e.target.value;
        setCurrentAsset((currentAsset: AssetObject) => {
            const obj = {...currentAsset};
            // @ts-ignore
            obj[key] = value;
            return obj;
        });
    };

    const uploadAndSave = () => {
        if (!file) {
            alert('You need to upload a model for creating an asset')
            return;
        }
        onSave()
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
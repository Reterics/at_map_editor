import Layout from "@/components/layout";
import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {
    BsPencilSquare,
    BsFillTrashFill
} from "react-icons/bs";
import {ATMap} from "@/src/types/map";
import {db, firebaseCollections, getCollection} from "@/src/firebase/config";
import {doc} from "firebase/firestore";
import {deleteDoc} from "@firebase/firestore";


export default function Home() {
    const [maps, setMaps] = useState([] as ATMap[]);
    const router = useRouter();

    const deleteMap = async (id: string|undefined) => {
        if (id && window.confirm('Are you sure you wish to delete this Map?')) {
            alert('Method is not implemented');
            await deleteDoc(doc(db, firebaseCollections.maps, id));
        }
    };

    const openMap = (map: ATMap) => {
        router.push('/editor?id=' + map.id);
    };

    const refreshMaps = async () => {
        getCollection(firebaseCollections.maps).then((maps) => setMaps(maps as ATMap[]));
    };
    useEffect(() => {
        void refreshMaps();
    });

    return (
        <Layout>
            <div className="flex justify-between max-w-screen-xl m-auto">
                <div />
                <button type="button"
                        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none
                            focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2
                            dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                        onClick={() => alert("Method is not implemented")}
                >
                    Create Map
                </button>
            </div>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            ID
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Author
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Created At
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Action
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {maps.map((map) =>
                        <tr key={map.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">

                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.id}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.name || "No name defined"}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.author || "You"}
                            </th>
                            <th scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {map.created ? new Date(map.created).toISOString().replace(/[TZ]/g, ' ').split('.')[0] : ''}
                            </th>
                            <td className="px-6 py-4 flex flex-row text-lg">
                                <BsPencilSquare className="cursor-pointer ml-2" onClick={() => openMap(map)}/>
                                <BsFillTrashFill className="cursor-pointer ml-2" onClick={() =>
                                    deleteMap(map.id)}/>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

        </Layout>
    )
}
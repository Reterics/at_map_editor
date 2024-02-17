import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BsPencilSquare,
    BsFillTrashFill
} from "react-icons/bs";
import { ATMap } from "@/src/types/map";
import { db, firebaseCollections, getCollection } from "@/src/firebase/config";
import { doc } from "firebase/firestore";
import { deleteDoc } from "@firebase/firestore";
import Link from "next/link";


export default function Home() {
    const [maps, setMaps] = useState([] as ATMap[]);
    const router = useRouter();
    const grid: {
        x: number,
        y: number,
        z: number,
        projection2D: ATMap[][]
    } = {
        x: 10,
        y: 10,
        z: 1,
        projection2D: []
    };
    grid.projection2D = Array.from(Array(grid.x)).map(_=>[]);
    const gridTemplateColumns = [];

    const gridNodes = [];

    maps.forEach(map=>{
        if (!map.name) {
            return;
        }
        const coordinates = map.name.split('-').map(a=>Number(a));
        const eligible = coordinates.length >= 2 && !Number.isNaN(coordinates[0]) && !Number.isNaN(coordinates[1]);

        if (eligible) {
            const x = coordinates.shift() as number;
            const y = coordinates.shift() as number
            if (grid.projection2D[x]) {

                grid.projection2D[x][y] = map;
            }
        }
    });

    for (let x = 0; x < grid.x; x++) {
        for (let y = 0; y < grid.y; y++) {
            if (grid.projection2D[x] && grid.projection2D[x][y]) {
                const map  = grid.projection2D[x][y];
                gridNodes.push((<Link
                    style={{
                        background: map.texture ? "url('"+map.texture+"')" : '#004900'
                    }}
                    id={map.id}
                    className='map-grid ready' href={'/editor?id=' + map.id}> </Link>))

            } else {
                gridNodes.push((<Link className='map-grid' href={'/editor?name=' +
                    x.toString().padStart(4, '0') + '-' + y.toString().padStart(4, '0')}> </Link>))
            }
        }
        gridTemplateColumns.push('1fr');
    }

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
    }, []);

    return (
        <Layout>

            <div className="grid-container grid" style={{
                display: 'grid',
                gridTemplateColumns: gridTemplateColumns.join(' ')
            }}>
                {gridNodes}
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
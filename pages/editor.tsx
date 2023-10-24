import Layout from "@/components/layout";
import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {
    BsPencilSquare,
    BsFillTrashFill
} from "react-icons/bs";
import {ATMap} from "@/src/types/map";
import CanvasEditor from "@/components/lib/CanvasEditor";


export default function Editor() {
    return (
        <Layout>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-w-screen-xl m-auto w-full mt-2">
                <CanvasEditor />
            </div>
        </Layout>
    )
}
import Header from "./header";
import { Providers } from "@/app/providers";

export default function Layout({
   children,
}: {
    children: React.ReactNode
}) {

    return (
        <>
            <Providers>
                <Header />
                <div className="p-2">{children}</div>
            </Providers>
        </>
    )
}

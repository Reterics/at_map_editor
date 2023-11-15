import { CSSProperties, MouseEventHandler } from "react";

export default function ToolbarButton({
    children,
    active,
    onClick,
    style
}: {
    children: React.ReactNode,
    active?: boolean|undefined|null,
    onClick?: MouseEventHandler<HTMLButtonElement>|undefined,
    style?: CSSProperties | undefined
}) {
    const appliedStyle = style || {};
    appliedStyle.borderColor = active ? 'white' : "gray";
    return (
        <button onClick={onClick}
                style={appliedStyle}
                className="p-2 text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-100
                    hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600
                    dark:focus:ring-blue-500 dark:focus:text-white mr-1">
            {children}
        </button>
    )
}
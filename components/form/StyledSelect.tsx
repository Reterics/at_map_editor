import { StyledSelectArgs, StyledSelectOption } from "@/src/types/inputs";
import React from "react";

export const textToOptions = (strings: string[], names: string[]|undefined):  StyledSelectOption[] => {
    return strings.map((string, index) => {
        return { value: string, name: names ? names[index] : string }
    });
}

export default function StyledSelect({ value, onSelect, name, label, options }: StyledSelectArgs) {
    return (
        <div className="relative z-0 w-full group mt-4">
            <select name={name}
                    id={name}
                    value={value}
                    onChange={onSelect}
                    className="block py-1.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0
                                   border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600
                                   dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600
                                   dark:bg-gray-800 dark:placeholder-gray-400 peer"
                    placeholder=" " required >
                <option defaultChecked={true}>Please Select</option>
                {options.map((option, index) =>
                    <option key={name + '_' + option.value + '_' + index} value={option.value}>{option.name}</option>
                )}
            </select>
            <label htmlFor={name}
                   className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400
                                   duration-300 transform -translate-y-6 scale-75 top-2 -z-10 origin-[0]
                                   peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500
                                   peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                                   peer-focus:scale-75 peer-focus:-translate-y-6 whitespace-nowrap">{label || name}</label>
        </div>
    )
}
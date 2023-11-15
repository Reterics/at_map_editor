import React from "react";
import { StyledInputArgs } from "@/src/types/inputs";

export default function StyledInput({
                                        value,
                                        onChange,
                                        type = "text",
                                        name,
                                        label,
                                        placeholder,
                                        pattern,
                                        maxLength,
                                        min,
                                        max,
                                        className
                                    }: StyledInputArgs) {
    // TODO: Pattern validation

    const validateOnFocusLoss = () => {
        if (pattern && value) {
            if ((new RegExp(pattern as string, 'g')).test(value.toString())) {
                console.log(value + ' is matching with ' + pattern);
                return;
            }
            console.warn('Value is not matching with ' + pattern);
        }

    };
    return (
        <div className={className||"relative z-0 w-full group mt-3"}>
            <input type={type} name={name}
                   id={name}
                   value={value === undefined ? '' : value}
                   onChange={onChange}
                   onBlur={validateOnFocusLoss}
                   className="block py-2 px-0 w-full text-sm text-gray-900 bg-transparent border-0
                                   border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600
                                   dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                   placeholder={placeholder || ''}
                   min={min}
                   max={max}
                   maxLength={maxLength}
                   pattern={pattern}
                   required/>
            <label htmlFor={name}
                   className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400
                                   duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0]
                                   peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500
                                   peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                                   peer-focus:scale-75 peer-focus:-translate-y-6">{label || name}</label>
        </div>
    )
}
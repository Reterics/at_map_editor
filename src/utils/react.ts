/**
 * React Overrides/Replacement methods
 */
import {AnyObj, WindowMethod} from "@/src/types/react";


export const useWindow = (method: WindowMethod, id: string|object, ref?: any) => {
    window.AT_Editor = window.AT_Editor || {};
    window.AT_Editor.windowCache = window.AT_Editor.windowCache || {};
    window.AT_Editor.windowRefs = window.AT_Editor.windowRefs || {};

    if (typeof id === "object") {
        const keys = Array.isArray(id) ? id : Object.keys(id);
        let missing = false;
        const output = keys.reduce((out, key) => {
            if (window.AT_Editor.windowCache[key] &&
                (ref === undefined || window.AT_Editor.windowRefs[key] === ref)) {
                out[key] = window.AT_Editor.windowCache[key]
            } else {
                missing = true;
            }
            return out;
        }, {} as AnyObj);

        if (!missing) {
            return output;
        }
        const result = method.call(output);

        return keys.reduce((out, key) => {
            if (result[key]) {
                window.AT_Editor.windowCache[key] = result[key];
                window.AT_Editor.windowRefs[key] = ref;
                out[key] = result[key]
            }
            return out;
        }, {} as AnyObj);
    }
    if (window.AT_Editor.windowCache[id] &&
        (ref === undefined || window.AT_Editor.windowRefs[id] === ref)) {
        return window.AT_Editor.windowCache[id];
    }
    window.AT_Editor.windowRefs[id] = ref;
    window.AT_Editor.windowCache[id] = method.call(window.AT_Editor.windowCache[id]);
    return window.AT_Editor.windowCache[id];
}

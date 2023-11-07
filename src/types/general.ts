declare global {
    interface Window { AT_Editor: any; }
}


export type LayoutType = 'normal'|'canvas'|'three';
export type ThreeControlType = 'orbit'|'object'|'trackball';

export interface TextFile {
    value: string|ArrayBuffer|null,
    file_input?: File
}

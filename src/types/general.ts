

export type LayoutType = 'normal'|'canvas'|'three';

export interface TextFile {
    value: string|ArrayBuffer|null,
    file_input?: File
}

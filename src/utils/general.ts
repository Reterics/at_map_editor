import { TextFile } from "@/src/types/general";

export const colorNameToHex = (colorName: string) => {
    const colorNames:{[keys: string]:string} = {
        black: "#000000",
        white: "#ffffff",
        red: "#ff0000",
        green: "#008000",
        blue: "#0000ff",
        yellow: "#ffff00",
        orange: "#ffa500",
        purple: "#800080",
        pink: "#ffc0cb",
        brown: "#a52a2a",
        gray: "#808080",
    };

    // Convert the color name to lowercase to make it case-insensitive
    const lowerCaseColorName = colorName.toLowerCase();

    // Check if the color name exists in the list
    if (colorNames.hasOwnProperty(lowerCaseColorName)) {
        return colorNames[lowerCaseColorName] as string;
    } else {
        return colorNames.black as string;
    }
};

export const getContrastToHEX = (background: string) => {
    if (!background.startsWith("#")) {
        background = colorNameToHex(background);
    }
    // Extract the RGB components of the background color
    const r = parseInt(background.slice(1, 3), 16);
    const g = parseInt(background.slice(3, 5), 16);
    const b = parseInt(background.slice(5, 7), 16);

    // Calculate the relative luminance (perceptual brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Choose white or black text based on the luminance value
    return luminance > 0.5 ? "#000000" : "#ffffff";
};


export const interpolateColor = (color1: string, color2: string, percentage: number) => {
    // Parse the color strings to obtain RGB values
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * percentage);
    const g = Math.round(g1 + (g2 - g1) * percentage);
    const b = Math.round(b1 + (b2 - b1) * percentage);

    // Convert the interpolated RGB values to a hex color code
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};


export const downloadAsFile = (name: string, body: string, fileType = 'text/plain') => {
    if (!name) {
        name = Math.floor(new Date().getTime() / 360000) + ".json";
    }
    try {
        let textToSaveAsBlob = new Blob([body], { type: fileType });
        let textToSaveAsURL = URL.createObjectURL(textToSaveAsBlob);
        let fileNameToSaveAs = name;

        let downloadLink = document.createElement('a');
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = 'Download As File';
        downloadLink.href = textToSaveAsURL;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        downloadLink.click();
        downloadLink.outerHTML = '';


    } catch (e) {
        // @ts-ignore
        console.error(e.message);
    }
};


export const uploadFileInputAsText = (file: Blob): Promise<string|ArrayBuffer|null> => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result);
        };
        reader.readAsText(file);
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    })
};

export const readTextFile = (accept = 'application/json'): Promise<TextFile> => {
    return new Promise(resolve => {
        const fileInput = document.createElement("input");
        fileInput.setAttribute("type", "file");
        if (accept) {
            fileInput.setAttribute('accept', accept);
        }
        fileInput.onchange = async function () {
            const formData: TextFile = {
                value: ''
            };
            const files = fileInput.files as FileList;
            if (files && files.length) {
                formData.value = await uploadFileInputAsText(files[0]);
                formData.file_input = files[0];
            }
            fileInput.outerHTML = "";
            resolve(formData);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
    });
}
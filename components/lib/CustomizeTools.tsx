import { AssetObject, Circle, Point, Rectangle, Asset, Line } from "@/src/types/assets";
import { ChangeEvent, SyntheticEvent, useRef } from "react";
import { BsEraserFill, BsPaintBucket } from "react-icons/bs";
import ToolbarButton from "@/components/form/ToolbarButton";
import { StyledSelect, StyledSelectOption } from "uic-pack";


export default function CustomizeTools({ reference, selected, items, setItems, setReference }:
{
    reference: Asset | Rectangle | Circle | Line | Point,
    items: AssetObject[],
    selected?: AssetObject,
    setItems: Function,
    setReference: Function
}) {
    const colorRef = useRef(null);
    const currentRef = selected || reference;
    const textureOptions: StyledSelectOption[] = ["b30", "carton", "osb", "plastic", "wall"].map((key)=>{
        return {
            "name": key,
            "value": "/assets/textures/attributed_" + key + ".jpg"
        } as StyledSelectOption
    }).concat([{ "name": "Select Texture", "value": "" }]);

    const onColorChange = (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLInputElement;
        const color = target.value;
        if (selected) {
            setItems([...items.map((item) => {
                if (item.selected) {
                    item.color = color;
                }
                return item;
            })]);
            return;
        }
        setReference({ ...reference, color: color });
    };

    const onTextureChange = (event: SyntheticEvent<HTMLSelectElement, Event>) => {
        const target = event.target as HTMLSelectElement;
        const texture = target.value;

        if (selected) {
            setItems([...items.map((item) => {
                if (item.selected) {
                    item.texture = texture;
                }
                return item;
            })]);
            return;
        }

        setReference({ ...reference, texture: texture });
    };

    const deleteSelected = (): void => {
        setItems([...items.filter((item) => !item.selected)]);
    };

    return (
        <div className="inline-block ml-4">
            <ToolbarButton
                onClick={()=>colorRef.current && (colorRef.current as HTMLInputElement).click()}
                style={{ backgroundColor: currentRef.color || '#000000' }}>
                <input ref={colorRef}
                       type="color"
                       className="hidden"
                       value={currentRef.color || '#000000'}
                       onChange={onColorChange}/>
                <BsPaintBucket />
            </ToolbarButton>

            <div className="w-[115px] inline-block">
                <StyledSelect
                    className={"relative z-0 w-full group m-1 pr-3"}
                    type="text" name="texture"
                    options={textureOptions}
                    value={currentRef.texture ? currentRef.texture : ''}
                    onSelect={onTextureChange}
                    label=""
                />
            </div>

            {selected && <ToolbarButton onClick={()=>deleteSelected()}>
                <BsEraserFill />
            </ToolbarButton>}

        </div>
    )

}

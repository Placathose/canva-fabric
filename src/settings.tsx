import React, { useState, useEffect } from 'react'
import { Canvas, FabricObject } from 'fabric'
import { Input } from '@/components/ui/input'



function Settings({ canvas }: { canvas: Canvas }) {
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [diameter, setDiameter] = useState<number>(0);
  const [color, setColor] = useState<string>("");

  useEffect(() => {
    if(canvas) {
      canvas.on('selection:created', (event: { selected: FabricObject[] }) => {
        handleObjectSelection(event.selected[0]);
      });
      canvas.on('selection:updated', (event: { selected: FabricObject[] }) => {
        handleObjectSelection(event.selected[0]);
      });
      canvas.on('selection:cleared', (event: { deselected: FabricObject[] }) => {
        handleObjectSelection(null);
        clearSettings();
      });
      canvas.on('object:modified', (event: { target: FabricObject }) => {
        handleObjectSelection(event.target);
      });
      canvas.on('object:scaling', (event: { target: FabricObject }) => {
        handleObjectSelection(event.target);
      });
    }
  }, [canvas]);

  const handleObjectSelection = (object: FabricObject | null) => {
    if(!object) return;

    setSelectedObject(object);

    if(object.type === 'rect') {
      setWidth(Math.round(object.width * object.scaleX));
      setHeight(Math.round(object.height * object.scaleY));
      setColor(typeof object.fill === 'string' ? object.fill : object.fill?.toString() ?? '')
      setDiameter(0)
    } else if(object.type === 'circle') {
      setDiameter(Math.round((object.get('radius') ?? 0) * 2 * object.scaleX));
      setColor(typeof object.fill === 'string' ? object.fill : object.fill?.toString() ?? '')
      setWidth(0)
      setHeight(0)
    } else if(object.type === 'ellipse') {
      setWidth(Math.round((object.get('rx') ?? 0) * object.scaleX));
      setHeight(Math.round((object.get('ry') ?? 0) * object.scaleY));
      setColor(typeof object.fill === 'string' ? object.fill : object.fill?.toString() ?? '')
      setDiameter(0)
    }
  }

  const clearSettings = () => {
    setSelectedObject(null);
    setWidth(0);
    setHeight(0);
    setDiameter(0);
    setColor("");
  }

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, "");
    const intValue = parseInt(value, 10);

    setWidth(intValue);
    if(selectedObject && selectedObject.type === 'rect' && intValue >= 0) {
      selectedObject.set({ width: intValue / selectedObject.scaleX });
      canvas.renderAll();
    }
  }

  const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, "");
    const intValue = parseInt(value, 10);

    setHeight(intValue);
    if(selectedObject && selectedObject.type === 'rect' && intValue >= 0) {
      selectedObject.set({ height: intValue / selectedObject.scaleY });
      canvas.renderAll();
    }
  }

  const handleDiameterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, "");
    const intValue = parseInt(value, 10);

    setDiameter(intValue);
    if(selectedObject && selectedObject.type === 'circle' && intValue >= 0) {
      selectedObject.set({ radius: intValue / 2 / selectedObject.scaleX });
      canvas.renderAll();
    }
  }
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setColor(value);
    if(selectedObject) {
      selectedObject.set({ fill: value });
      canvas.renderAll();
    }
  }

  return (
    <div>
      {selectedObject && selectedObject.type === 'rect' && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="width-input" className="block text-sm font-medium mb-1">Width</label>
            <Input
              id="width-input"
              type="number"
              value={width}
              onChange={handleWidthChange}
            />
          </div>
          <div>
            <label htmlFor="height-input" className="block text-sm font-medium mb-1">Height</label>
            <Input
              id="height-input"
              type="number"
              value={height}
              onChange={handleHeightChange}
            />
            <Input
              id="color-input"
              type="color"
              value={color}
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}
      {selectedObject && selectedObject.type === 'circle' && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="diameter-input" className="block text-sm font-medium mb-1">Diameter</label>
            <Input
              id="diameter-input"
              type="number"
              value={diameter}
              onChange={handleDiameterChange}
            />
          </div>
          <div>
            <label htmlFor="color-input" className="block text-sm font-medium mb-1">Color</label>
            <Input
              id="color-input"
              type="color"
              value={color}
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}
      {selectedObject && selectedObject.type === 'ellipse' && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="width-input" className="block text-sm font-medium mb-1">Width</label>
            <Input
              id="width-input"
              type="number"
              value={width}
              onChange={handleWidthChange}
            />
          </div>
          <div>
            <label htmlFor="height-input" className="block text-sm font-medium mb-1">Height</label>
            <Input
              id="height-input"
              type="number"
              value={height}
              onChange={handleHeightChange}
            />
          </div>
          <div>
            <label htmlFor="color-input" className="block text-sm font-medium mb-1">Color</label>
            <Input
              id="color-input"
              type="color"
              value={color}
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
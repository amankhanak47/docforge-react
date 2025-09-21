import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Expand,
  Shrink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  X,
} from 'lucide-react';

interface ImageControlsProps {
  image: HTMLImageElement;
  position: { x: number; y: number };
  editor: Editor;
  onClose: () => void;
}

export const ImageControls = ({ image, position, editor, onClose }: ImageControlsProps) => {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  useEffect(() => {
    if (image) {
      const currentWidth = image.width || image.naturalWidth;
      const currentHeight = image.height || image.naturalHeight;
      setWidth(currentWidth);
      setHeight(currentHeight);
      setAspectRatio(currentWidth / currentHeight);
    }
  }, [image]);

  const updateImageSize = (newWidth: number, newHeight: number) => {
    const selection = editor.state.selection;
    const pos = editor.view.posAtDOM(image, 0);
    
    editor.chain()
      .setNodeSelection(pos)
      .updateAttributes('image', {
        width: newWidth,
        height: newHeight,
      })
      .run();
  };

  const handleWidthChange = (value: string) => {
    const newWidth = parseInt(value);
    if (!isNaN(newWidth)) {
      const newHeight = Math.round(newWidth / aspectRatio);
      setWidth(newWidth);
      setHeight(newHeight);
      updateImageSize(newWidth, newHeight);
    }
  };

  const handleHeightChange = (value: string) => {
    const newHeight = parseInt(value);
    if (!isNaN(newHeight)) {
      const newWidth = Math.round(newHeight * aspectRatio);
      setWidth(newWidth);
      setHeight(newHeight);
      updateImageSize(newWidth, newHeight);
    }
  };

  const resizeImage = (factor: number) => {
    const newWidth = Math.round(width * factor);
    const newHeight = Math.round(height * factor);
    setWidth(newWidth);
    setHeight(newHeight);
    updateImageSize(newWidth, newHeight);
  };

  const alignImage = (alignment: 'left' | 'center' | 'right') => {
    const selection = editor.state.selection;
    const pos = editor.view.posAtDOM(image, 0);
    
    editor.chain()
      .setNodeSelection(pos)
      .updateAttributes('image', {
        style: `display: block; margin-${alignment === 'center' ? '0 auto' : alignment === 'left' ? 'right auto' : 'left auto'};`
      })
      .run();
  };

  const deleteImage = () => {
    const selection = editor.state.selection;
    const pos = editor.view.posAtDOM(image, 0);
    
    editor.chain()
      .setNodeSelection(pos)
      .deleteSelection()
      .run();
    
    onClose();
  };

  return (
    <Card 
      className="absolute z-50 w-64 shadow-lg"
      style={{ 
        left: position.x,
        top: position.y,
        transform: 'translateY(-50%)'
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Image Controls</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Size Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width" className="text-xs">Width</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs">Height</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Quick Resize */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resizeImage(0.5)}
              className="flex-1 h-7 text-xs"
            >
              <Shrink className="h-3 w-3 mr-1" />
              50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => resizeImage(1.5)}
              className="flex-1 h-7 text-xs"
            >
              <Expand className="h-3 w-3 mr-1" />
              150%
            </Button>
          </div>

          <Separator />

          {/* Alignment */}
          <div>
            <Label className="text-xs mb-2 block">Alignment</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignImage('left')}
                className="flex-1 h-7"
              >
                <AlignLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignImage('center')}
                className="flex-1 h-7"
              >
                <AlignCenter className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignImage('right')}
                className="flex-1 h-7"
              >
                <AlignRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteImage}
            className="w-full h-7 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
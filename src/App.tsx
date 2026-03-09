import { useEffect, useRef, useState } from 'react'
import { Canvas, Rect, Circle, Ellipse } from 'fabric'
import './index.css'
import { Button } from '@/components/ui/button'
import { Circle as CircleIcon, Square as SquareIcon, Ellipse as EllipseIcon } from 'lucide-react'
import Settings from './settings'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<Canvas | null>(null)

  useEffect(() => {
    // check if the canvas assigned to dom
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: 500,
        height: 500,
      });
      initCanvas.backgroundColor = 'white';
      initCanvas.renderAll();

      setCanvas(initCanvas);

      // dispose the canvas when the component unmounts
      return () => {
        initCanvas.dispose();
      }
    }
  }, [])

  const addRectangle = () => {
    if(canvas) {
      const rect = new Rect({
        left: 50,
        top: 100,
        width: 100,
        height: 60,
        fill: 'red',
      });
      canvas.add(rect);
    }
  }
  const addCircle = () => {
    if(canvas) {
      const circle = new Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: 'blue',
      });
      canvas.add(circle);
    }
  }

  const addEllipse = () => {
    if(canvas) {
      const ellipse = new Ellipse({
        left: 250,
        top: 250,
        rx: 50,
        ry: 30,
        fill: 'green',
      });
      canvas.add(ellipse);
    }
  }

  return (
    <div className="app bg-gray-500">
      <div className="toolbar darkmode">
        <Button onClick={addRectangle} variant="ghost" size="icon" aria-label="Add rectangle">
          <SquareIcon />
        </Button>
        <Button onClick={addCircle} variant="ghost" size="icon" aria-label="Add circle">
          <CircleIcon />
        </Button>
        <Button onClick={addEllipse} variant="ghost" size="icon" aria-label="Add Ellipse">
          <EllipseIcon />
        </Button>
      </div>
      <canvas id="canvas" ref={canvasRef} />
      <Settings canvas={canvas} />
    </div>
  )
}

export default App

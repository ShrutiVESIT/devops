import React, { useEffect, useRef, useState } from 'react';
import { FaPlay } from "react-icons/fa6";
import { RxCross2 } from 'react-icons/rx';

// Type definitions for Snake and Apple classes
interface IRect {
  x: number;
  y: number;
}

class Snake {
  x: number;
  y: number;
  size: number;
  tail: IRect[];
  rotateX: number;
  rotateY: number;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.tail = [{ x: this.x, y: this.y }];
    this.rotateX = 0;
    this.rotateY = 1;
  }

  move() {
    let newRect: IRect;

    if (this.rotateX === 1) {
      newRect = {
        x: this.tail[this.tail.length - 1].x + this.size,
        y: this.tail[this.tail.length - 1].y,
      };
    } else if (this.rotateX === -1) {
      newRect = {
        x: this.tail[this.tail.length - 1].x - this.size,
        y: this.tail[this.tail.length - 1].y,
      };
    } else if (this.rotateY === 1) {
      newRect = {
        x: this.tail[this.tail.length - 1].x,
        y: this.tail[this.tail.length - 1].y + this.size,
      };
    } else {
      newRect = {
        x: this.tail[this.tail.length - 1].x,
        y: this.tail[this.tail.length - 1].y - this.size,
      };
    }

    this.tail.shift();
    this.tail.push(newRect);
  }
}

class Apple {
  x: number;
  y: number;
  size: number;
  color: string;

  constructor(snake: Snake, canvasWidth: number, canvasHeight: number) {
    this.size = snake.size;
    this.color = 'red';

    // Randomly place apple in grid, ensuring it doesn't overlap with the snake
    let isTouching: boolean;
    do {
      isTouching = false;
      this.x = Math.floor(Math.random() * (canvasWidth / this.size)) * this.size;
      this.y = Math.floor(Math.random() * (canvasHeight / this.size)) * this.size;

      for (const segment of snake.tail) {
        if (this.x === segment.x && this.y === segment.y) {
          isTouching = true;
          break;
        }
      }
    } while (isTouching);
  }
}

const GameCard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snakeRef = useRef<Snake>(new Snake(20, 20, 20));
  const appleRef = useRef<Apple | null>(null);
  // const [score, setScore] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  // const [score, setScore] = useState<number>(0);
  let scr = 0;
  const [fps] = useState(20);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');

    // Initialize apple
    appleRef.current = new Apple(snakeRef.current, canvas.width, canvas.height);



    const gameLoop = setInterval(() => {
      if (!paused && !gameOver && context && canvas) {
        update(canvas, context);
        draw(context, canvas);
      }
    }, 2000 / fps);

    const handleKeydown = (event: KeyboardEvent) => {
      const snake = snakeRef.current;
      if (event.key === 'ArrowLeft' && snake.rotateX !== 1) {
        snake.rotateX = -1;
        snake.rotateY = 0;
      } else if (event.key === 'ArrowUp' && snake.rotateY !== 1) {
        snake.rotateX = 0;
        snake.rotateY = -1;
      } else if (event.key === 'ArrowRight' && snake.rotateX !== -1) {
        snake.rotateX = 1;
        snake.rotateY = 0;
      } else if (event.key === 'ArrowDown' && snake.rotateY !== -1) {
        snake.rotateX = 0;
        snake.rotateY = 1;
      }else if (event.code === 'Space') {
        setPaused(!paused)
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [paused, gameOver, fps]);

  const update = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const snake = snakeRef.current;
    // const apple = appleRef.current;

    context.clearRect(0, 0, canvas.width, canvas.height)
    snake.move();
    eatApple();
    checkHitWall(canvas);
  };

  const eatApple = () => {
    const snake = snakeRef.current;
    const apple = appleRef.current;
    if (!apple) return;

    const head = snake.tail[snake.tail.length - 1];
    if (head.x === apple.x && head.y === apple.y) {
      snake.tail.push({ x: apple.x, y: apple.y });
      appleRef.current = new Apple(snake, canvasRef.current!.width, canvasRef.current!.height);
      // setScore(ps => ps + 1); // Only update score
      scr += 1;
      setHighScore(scr);
    }
  };

  const checkHitWall = (canvas: HTMLCanvasElement) => {
    const snake = snakeRef.current;
    const head = snake.tail[snake.tail.length - 1];

    // Check if the snake head goes out of bounds
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
      setPaused(true);
      setGameOver(true);
      // setScore(0)
    }
  };

  const draw = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const snake = snakeRef.current;
    const apple = appleRef.current;

    createRect(context, 0, 0, canvas.width, canvas.height, 'black');
    snake.tail.forEach((segment) => {
      createRect(context, segment.x + 2.5, segment.y + 2.5, snake.size - 5, snake.size - 5, 'white');
    });

    context.font = '20px Arial';
    context.fillStyle = '#00FF42';
    context.fillText('Score: ' + scr, canvas.width - 120, 38);

    if (apple) {
      createRect(context, apple.x, apple.y, apple.size, apple.size, apple.color);
    }
  };

  const createRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
  const resetGame = () => {
    // Reset snake and apple
    const canvas = canvasRef.current!;
    snakeRef.current = new Snake(20, 20, 20);
    appleRef.current = new Apple(snakeRef.current, canvas.width, canvas.height);
    
    // Reset game state
    scr = 0;
    setGameOver(false);
    setPaused(false);
  };

  function pauseGame() {
    setPaused(!paused)

  }

  return <div className='mt-[10px] '>


    <div className={`${gameOver ?' hidden ':' '}`}>
      <button onClick={pauseGame} className='m-2 focus:outline-none bg-slate-800 hover:border-green-600 text-green-600'><FaPlay /></button>
      <a href="/" className='hover:text-white text-white m-2'><button className='focus:outline-none bg-slate-800 hover:border-green-600 text-green-600'><RxCross2 /></button></a>
   
      <canvas ref={canvasRef} className={`border-green-500 border-2 rounded-md w-[300px] h-[500px] md:w-[500px] md:h-[500px]`} width={500} height={500}></canvas>
    </div>
    {gameOver && (
      <div className=' p-3 rounded-md'>
        
        <button onClick={resetGame} className='font-bold bg-indigo-500 border-4 focus:outline-none  my-2'>Try Again ?</button>
        
        {/* <h2 className='text-4xl font-bold mt-4 mb-3'>Game Over!</h2> */}
        <img src="../public/game-over.png" width={200} height={200} className='border-green-500 border-4 w-[400px] my-2 mx-auto rounded-lg' alt="" />
        <p className='text-green-500 font-mono bg-slate-700 font-bold rounded-md'>Score - {highScore}</p>
      </div>
    )}

  </div>


};

export default GameCard;

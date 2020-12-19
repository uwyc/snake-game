"use strict";

type Fps = 30 | 60 | 120;

interface Point {
  x: number;
  y: number;
}

interface PointDelta {
  dx: number;
  dy: number;
}

interface GameOption {
  fps?: Fps;
}

const Game = {
  width: 480,
  height: 320,
}
function timestamp() {
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

class FpsText {
  x: number = 0;
  y: number = 0;
  fps: number = 0;
  shown: boolean = true;

  public draw(context: CanvasRenderingContext2D, delta?: number) {
    if (this.shown) {
      this.fps = delta ? 1 / delta : 0;
      context.save();
      context.textBaseline = "top";
      context.fillText(Math.floor(this.fps).toString(), 0, 0);
      context.restore();
    }
  }
}

class Ball {
  private _radius = 10;
  private _center: Point = { x: 0, y: 0 };
  private _dx = 0;
  private _dy = 0;

  public get radius(): number {
    return this._radius;
  }

  public get center(): Point {
    return this._center
  }

  public set center(v: Point) {
    this._center = v;
  }

  public get dx(): number {
    return this._dx;
  }

  public set dx(v: number) {
    this._dx = v;
  }

  public get dy(): number {
    return this._dy;
  }

  public set dy(v: number) {
    this._dy = v;
  }

  public draw(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(this._center.x, this._center.y, this._radius, 0, Math.PI * 2);
    context.fillStyle = "#0095DD";
    context.fill();
    context.closePath();
  }
}

class Paddle {
  private _width = 75;
  private _height = 10;
  private _stepValue = 7;
  private _leftTop: Point = { x: 0, y: 0 };
  private _leftPressed: boolean = false;
  private _rightPressed: boolean = false;
  private _delta : number = 0;

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }

  public get leftTop(): Point {
    return this._leftTop;
  }

  public set leftTop(v: Point) {
    this._leftTop = v;
  }

  public get leftPressed(): boolean {
    return this._leftPressed;
  }

  public set leftPressed(v: boolean) {
    this._leftPressed = v;
  }

  public get rightPressed(): boolean {
    return this._rightPressed;
  }

  public set rightPressed(v: boolean) {
    this._rightPressed = v;
  }

  public get step(): number {
    let dir = this._delta;
    if (this._rightPressed) {
      dir++;
    }
    if (this._leftPressed) {
      dir--;
    }
    return this._stepValue * dir;
  }

  public draw(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.rect(this._leftTop.x, this._leftTop.y, this._width, this._height);
    context.fillStyle = "#0095DD";
    context.fill();
    context.closePath();
  }
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hit: boolean;
}

interface BricksOptions {
  rowCount: number;
  columnCount: number;
  width: number;
  height: number;
  padding: number;
  offsetTop: number;
  offsetLeft: number;
}

class Bricks {
  private _bricks: Brick[] = [];
  private _numberOfHitBrick: number = 0;

  public regenerate(options: BricksOptions) {
    let bricks = [];
    for (let c = 0; c < options.columnCount; c++) {
      for (let r = 0; r < options.rowCount; r++) {
        bricks.push({
          x: c * (options.width + options.padding) + options.offsetLeft,
          y: r * (options.height + options.padding) + options.offsetTop,
          width: options.width,
          height: options.height,
          hit: false,
        });
      }
    }
    this._bricks = bricks;
    this._numberOfHitBrick = 0;
  }

  public hit(center: Point): boolean {
    for (let i = 0; i < this._bricks.length; i++) {
      let brick = this._bricks[i];
      if (!brick.hit) {
        if (center.x > brick.x && center.x < brick.x + brick.width &&
          center.y > brick.y && center.y < brick.y + brick.height) {
          brick.hit = true;
          this._numberOfHitBrick++;
          return true;
        }
      }
    }
    return false;
  }

  public isEmpty(): boolean {
    if (this._bricks.length == this._numberOfHitBrick) {
      return true;
    }
    return false;
  }

  public draw(context: CanvasRenderingContext2D) {
    this._bricks.forEach(brick => {
      if (!brick.hit) {
        context.beginPath();
        context.rect(brick.x, brick.y, brick.width, brick.height);
        context.fillStyle = "#0095DD";
        context.fill();
        context.closePath();
      }
    });
  }
}

type GameState = "START" | "GAME OVER" | "CONGRATULATIONS";

class GameBoard {
  private terminated: boolean;
  private delta: number;
  private last: number;
  private step: number;

  private _canvas: HTMLCanvasElement;
  private _fpsText: FpsText;
  private _ball: Ball;
  private _paddle: Paddle;
  private _bricks: Bricks;
  private _score: number;
  private _state: GameState;

  constructor(container: HTMLElement, options: GameOption) {
    this.terminated = true;
    this.delta = 0;
    this.last = 0;
    this.step = options.fps ? 1 / options.fps : 1 / 60;

    let canvas = document.createElement('canvas');
    this._canvas = canvas;
    canvas.width = Game.width;
    canvas.height = Game.height;
    this._fpsText = new FpsText();
    this._ball = new Ball();
    this._paddle = new Paddle();
    this._bricks = new Bricks();

    this.init();
    this.createUserEvents();
    container.appendChild(this._canvas);
    requestAnimationFrame(this.frame.bind(this));
  }

  run() {
    this.terminated = false;
    this.delta = 0;
    this.last = timestamp();
  }

  protected update(delta: number): void {
    if (this.terminated) {
      return;
    }

    if (!this.updateBall()) {
      this.terminated = true;
    }
    this.updatePaddle();
  }

  protected render(delta: number): void {
    let context = this._canvas.getContext("2d");
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._fpsText.draw(context, delta);
    this._paddle.draw(context);
    this._ball.draw(context);
    this._bricks.draw(context);
    this.drawText(context);
  }

  private init() {
    let canvas = this._canvas;
    this._ball.center = {
      x: canvas.width / 2,
      y: canvas.height - this._ball.radius - this._paddle.height
    };
    this._ball.dx = 2;
    this._ball.dy = -2;

    this._paddle.leftTop = {
      x: (canvas.width - this._paddle.width) / 2,
      y: canvas.height - this._paddle.height,
    }
    this._paddle.leftPressed = false;
    this._paddle.rightPressed = false;

    this._bricks.regenerate({
      rowCount: 3,
      columnCount: 5,
      width: 75,
      height: 20,
      padding: 10,
      offsetTop: 30,
      offsetLeft: 30,
    });

    this._score = 0;
    this._state = "START"
  }

  private createUserEvents() {
    document.addEventListener("keydown", (evt) => this.onkeydown(evt), false);
    document.addEventListener("keyup", (evt) => this.onkeyup(evt), false);
  }


  private updatePaddle() {
    const origLeftTop = this._paddle.leftTop;
    let x = origLeftTop.x + this._paddle.step;
    if (x < 0) {
      x = 0;
    } else if (x + this._paddle.width > this._canvas.width) {
      x = this._canvas.width - this._paddle.width;
    }
    this._paddle.leftTop = { x, y: origLeftTop.y };
  }


  private updateBall() {
    const origCenter = this._ball.center;
    let dx = this._ball.dx;
    let dy = this._ball.dy;
    const radius = this._ball.radius;
    const testX = origCenter.x + dx;
    const testY = origCenter.y + dy;

    if (this._bricks.hit(origCenter)) {
      dy = -dy;
      this._score++;
      if (this._bricks.isEmpty()) {
        this._state = "CONGRATULATIONS";
        return false;
      }
    }

    if (testX > this._canvas.width - radius || testX < radius) {
      dx = -dx;
    }

    const leftBottomX = this._paddle.leftTop.x;
    const rightBottomX = this._paddle.leftTop.x + this._paddle.width;
    if (testY < radius) {
      dy = -dy;
    } else if (testY > this._canvas.height - radius) {
      if (testX > leftBottomX && testX < rightBottomX) {
        dy = -dy;
      } else {
        this._state = "GAME OVER";
        return false;
      }
    }

    this._ball.dx = dx;
    this._ball.dy = dy;
    this._ball.center = { x: origCenter.x + dx, y: origCenter.y + dy };
    return true;
  }

  private drawText(context: CanvasRenderingContext2D) {
    let str = "Score: " + this._score;
    let text = context.measureText(str);
    context.fillStyle = "#0095DD";
    context.textBaseline = "top";
    context.fillText(str, this._canvas.width - text.width, 0, text.width);

    if (this.terminated) {
      str = this._state;
      context.save();
      context.textAlign = "center";
      context.textBaseline = "middle";
      text = context.measureText(str);
      context.fillText(str, this._canvas.width / 2, this._canvas.height / 2);

      str = "PRESS ENTER!";
      context.fillText(str, this._canvas.width / 2, this._canvas.height / 2
        + text.actualBoundingBoxAscent + text.actualBoundingBoxDescent + 5);
      context.restore();
    }
  }

  private onkeydown(e: KeyboardEvent) {
    if (e.key == "Right" || e.key == "ArrowRight") {
      this._paddle.rightPressed = true;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
      this._paddle.leftPressed = true;
    }
  }

  private onkeyup(e: KeyboardEvent) {
    if (e.key == "Right" || e.key == "ArrowRight") {
      this._paddle.rightPressed = false;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
      this._paddle.leftPressed = false;
    } else if (e.key == "Enter" && this.terminated) {
      this.init();
      this.run();
    }
  }

  private frame() {
    let now = timestamp();
    this.delta = this.delta + Math.min(1, (now - this.last) / 1000);
    while (this.delta > this.step) {
      this.delta = this.delta - this.step;
      this.update(this.step);
    }
    this.render(this.delta);
    this.last = now;

    requestAnimationFrame(this.frame.bind(this));
  }
}

let game = new GameBoard(document.body, { fps: 120 });

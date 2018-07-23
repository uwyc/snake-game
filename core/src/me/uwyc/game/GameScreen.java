package me.uwyc.game;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.ScreenAdapter;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.utils.Array;


/**
 * @author wyc
 */
public class GameScreen extends ScreenAdapter {
    private static final int MOVEMENT = 32;
    private static final float MOVE_TIME = .5F;
    private static final int LEFT = -1;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = -2;

    private SpriteBatch batch;
    private Texture snakeGraphics;
    private float timer = MOVE_TIME;

    private int snakeX = MOVEMENT * 2;
    private int snakeY = 0;
    private int snakeXBeforeUpdate = snakeX;
    private int snakeYBeforeUpdate = snakeY;
    private int snakeSrcX = MOVEMENT * 4;
    private int snakeSrcY = 0;
    private int snakeDirection = RIGHT;

    private boolean appleAvailable = false;
    private int appleX;
    private int appleY;

    private Array<BodyPart> snakeBody = new Array<BodyPart>();

    @Override
    public void show() {
        batch = new SpriteBatch();
        snakeGraphics = new Texture("snake-graphics.png");
        snakeBody.add(new BodyPart(0, 0, MOVEMENT * 4, MOVEMENT * 2, RIGHT));
        snakeBody.add(new BodyPart(MOVEMENT, 0, MOVEMENT, 0, RIGHT));
    }

    @Override
    public void render(float delta) {
        queryInput();
        timer -= delta;
        if (timer <= 0) {
            timer = MOVE_TIME;
            moveSnake();
            checkForOutOfBounds();
            updateSnakeBodyPosition();
        }
        checkAppleCollision();
        checkAndPlaceApple();
        Gdx.gl.glClearColor(Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
        batch.begin();
        if (appleAvailable) {
            int appleSrcX = 0;
            int appleSrcY = MOVEMENT * 3;
            batch.draw(snakeGraphics, appleX, appleY, appleSrcX, appleSrcY, MOVEMENT, MOVEMENT);
        }
        BodyPart bodyPart;
        for (int i = 0; i < snakeBody.size; i++) {
            bodyPart = snakeBody.get(i);
            if ((i == 0) && (bodyPart.getX() == snakeX) && (bodyPart.getY() == snakeY)) {
                continue;
            }
            batch.draw(snakeGraphics, bodyPart.getX(), bodyPart.getY(), bodyPart.getSrcX(), bodyPart.getSrcY(), MOVEMENT, MOVEMENT);
        }
        batch.draw(snakeGraphics, snakeX, snakeY, snakeSrcX, snakeSrcY, MOVEMENT, MOVEMENT);
        batch.end();
    }

    private void checkForOutOfBounds() {
        if (snakeX >= Gdx.graphics.getWidth()) {
            snakeX = 0;
        }
        if (snakeX < 0) {
            snakeX = Gdx.graphics.getWidth() - MOVEMENT;
        }
        if (snakeY >= Gdx.graphics.getHeight()) {
            snakeY = 0;
        }
        if (snakeY < 0) {
            snakeY = Gdx.graphics.getHeight() - MOVEMENT;
        }
    }

    private void moveSnake() {
        snakeXBeforeUpdate = snakeX;
        snakeYBeforeUpdate = snakeY;
        switch (snakeDirection) {
            case LEFT:
                snakeX -= MOVEMENT;
                snakeSrcX = MOVEMENT * 3;
                snakeSrcY = MOVEMENT;
                break;
            default:
            case RIGHT:
                snakeX += MOVEMENT;
                snakeSrcX = MOVEMENT * 4;
                snakeSrcY = 0;
                break;
            case UP:
                snakeY += MOVEMENT;
                snakeSrcX = MOVEMENT * 3;
                snakeSrcY = 0;
                break;
            case DOWN:
                snakeY -= MOVEMENT;
                snakeSrcX = MOVEMENT * 4;
                snakeSrcY = MOVEMENT;
                break;
        }
    }

    private void queryInput() {
        boolean lPressed = Gdx.input.isKeyPressed(Input.Keys.LEFT);
        boolean rPressed = Gdx.input.isKeyPressed(Input.Keys.RIGHT);
        boolean uPressed = Gdx.input.isKeyPressed(Input.Keys.UP);
        boolean dPressed = Gdx.input.isKeyPressed(Input.Keys.DOWN);
        if (lPressed && snakeDirection != RIGHT) {
            snakeDirection = LEFT;
        }
        if (rPressed && snakeDirection != LEFT) {
            snakeDirection = RIGHT;
        }
        if (uPressed && snakeDirection != DOWN) {
            snakeDirection = UP;
        }
        if (dPressed && snakeDirection != UP) {
            snakeDirection = DOWN;
        }
    }

    private void checkAndPlaceApple() {
        if (!appleAvailable) {
            appleX = MathUtils.random(Gdx.graphics.getWidth() / MOVEMENT - 1) * MOVEMENT;
            appleY = MathUtils.random(Gdx.graphics.getHeight() / MOVEMENT - 1) * MOVEMENT;
            appleAvailable = true;
        }
    }

    private void checkAppleCollision() {
        if (appleAvailable && snakeX == appleX && snakeY == appleY) {
            BodyPart bodyPart = new BodyPart(appleX, appleY, snakeDirection);
            int snakeBeforeDirection = snakeBody.peek().getDirection();
            checkBodyPart(bodyPart, snakeBeforeDirection);
            snakeBody.insert(0, bodyPart);
            appleAvailable = false;
        }
    }

    private void updateSnakeBodyPosition() {
        if (snakeBody.size > 0) {
            BodyPart bodyPart = snakeBody.removeIndex(0);
            int snakeBeforeDirection = snakeBody.peek().getDirection();
            bodyPart.setDirection(snakeDirection);
            bodyPart.updateBodyPosition(snakeXBeforeUpdate, snakeYBeforeUpdate);
            checkBodyPart(bodyPart, snakeBeforeDirection);
            snakeBody.add(bodyPart);
            bodyPart = snakeBody.first();
            switch (bodyPart.getDirection()) {
                default:
                case RIGHT:
                    bodyPart.updateBodyTexture(MOVEMENT * 4, MOVEMENT * 2);
                    break;
                case LEFT:
                    bodyPart.updateBodyTexture(MOVEMENT * 3, MOVEMENT * 3);
                    break;
                case UP:
                    bodyPart.updateBodyTexture(MOVEMENT * 3, MOVEMENT * 2);
                    break;
                case DOWN:
                    bodyPart.updateBodyTexture(MOVEMENT * 4, MOVEMENT * 3);
                    break;
            }
        }
    }

    private void checkBodyPart(BodyPart bodyPart, int snakeBeforeDirection) {
        switch (snakeBeforeDirection - snakeDirection) {
            case 1:
                bodyPart.updateBodyTexture(0, 0);
                break;
            case 3:
                bodyPart.updateBodyTexture(MOVEMENT * 2, 0);
                break;
            case -3:
                bodyPart.updateBodyTexture(0, MOVEMENT);
                break;
            case -1:
                bodyPart.updateBodyTexture(MOVEMENT * 2, MOVEMENT * 2);
                break;
            default:
                if (snakeDirection == LEFT || snakeDirection == RIGHT) {
                    bodyPart.updateBodyTexture(MOVEMENT, 0);
                } else {
                    bodyPart.updateBodyTexture(MOVEMENT * 2, MOVEMENT);
                }
        }
    }

    public class BodyPart {
        private int x;
        private int y;
        private int srcX;
        private int srcY;
        private int direction;

        BodyPart(int x, int y, int direction) {
            this.x = x;
            this.y = y;
            this.direction = direction;
        }

        BodyPart(int x, int y, int srcX, int srcY, int direction) {
            this(x, y, direction);
            updateBodyTexture(srcX, srcY);
        }

        void updateBodyPosition(int x, int y) {
            this.x = x;
            this.y = y;
        }

        void updateBodyTexture(int srcX, int srcY) {
            this.srcX = srcX;
            this.srcY = srcY;
        }

        int getX() {
            return x;
        }

        int getY() {
            return y;
        }

        int getSrcX() {
            return srcX;
        }

        int getSrcY() {
            return srcY;
        }

        int getDirection() {
            return direction;
        }

        void setDirection(int direction) {
            this.direction = direction;
        }
    }
}
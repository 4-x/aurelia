import { IRegistry } from '@aurelia/kernel';
import { ICustomElement } from '@aurelia/runtime';
import { Circle, Container, DisplayObject, Ellipse, Filter, Graphics, Matrix, ObservablePoint, Polygon, Rectangle, RoundedRectangle, Shader, Sprite, Texture, TransformBase } from 'pixi.js';
export interface PixiSprite extends ICustomElement<Node> {
}
export declare class PixiSprite {
    static readonly register: IRegistry['register'];
    readonly sprite: Sprite & {
        [key: string]: unknown;
    };
    container?: Container;
    src?: string;
    alpha?: number;
    buttomMode?: boolean;
    cacheAsBitmap?: boolean;
    cursor?: string;
    filterArea?: Rectangle;
    filters?: Filter<Object>[];
    hitArea?: Rectangle | Circle | Ellipse | Polygon | RoundedRectangle;
    interactive?: boolean;
    readonly localTransform: Matrix;
    mask?: Graphics;
    name?: string;
    readonly parent: Container;
    pivotX?: number;
    pivotY?: number;
    positionX?: number;
    positionY?: number;
    renderable?: boolean;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    skewX?: number;
    skewY?: number;
    transform?: TransformBase;
    visible?: boolean;
    readonly worldAlpha: number;
    readonly worldTransform: Matrix;
    readonly worldVisible: boolean;
    x?: number;
    y?: number;
    zIndex?: number;
    readonly children: DisplayObject[];
    height?: number;
    interactiveChildren?: boolean;
    sortableChildren?: boolean;
    sortDirty?: boolean;
    width?: number;
    anchor?: ObservablePoint;
    blendMode?: number;
    readonly isSprite: boolean;
    pluginName?: string;
    roundPixels?: boolean;
    shader?: Filter<Object> | Shader;
    texture?: Texture;
    tint?: number;
    private _sprite;
    constructor();
    attached(): void;
    detached(): void;
}
//# sourceMappingURL=pixi-sprite.d.ts.map
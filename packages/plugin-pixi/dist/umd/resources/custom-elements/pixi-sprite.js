(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/runtime", "pixi.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const runtime_1 = require("@aurelia/runtime");
    const pixi_js_1 = require("pixi.js");
    const directProps = [
        'alpha',
        'buttomMode',
        'cacheAsBitmap',
        'cursor',
        'filterArea',
        'filters',
        'hitArea',
        'interactive',
        'mask',
        'name',
        'renderable',
        'rotation',
        'transform',
        'visible',
        'x',
        'y',
        'zIndex',
        'height',
        'interactiveChildren',
        'sortableChildren',
        'sortDirty',
        'anchor',
        'blendMode',
        'pluginName',
        'roundPixels',
        'shader',
        'texture',
        'tint'
    ];
    const pointProps = [
        'pivot',
        'position',
        'scale',
        'skew'
    ];
    let PixiSprite = class PixiSprite {
        constructor() {
            this._sprite = null;
        }
        get sprite() {
            return this._sprite;
        }
        get localTransform() {
            return this.sprite.localTransform;
        }
        get parent() {
            return this.sprite.parent;
        }
        get worldAlpha() {
            return this.sprite.worldAlpha;
        }
        get worldTransform() {
            return this.sprite.worldTransform;
        }
        get worldVisible() {
            return this.sprite.worldVisible;
        }
        // Container properties
        // http://pixijs.download/dev/docs/PIXI.Container.html
        get children() {
            return this.sprite.children;
        }
        get isSprite() {
            return this.sprite['isSprite'];
        }
        afterAttach() {
            if (this.container) {
                const $this = this;
                this._sprite = new pixi_js_1.Sprite(pixi_js_1.loader.resources[this.src].texture);
                for (const prop of directProps) {
                    if ($this[prop] !== undefined) {
                        this._sprite[prop] = $this[prop];
                    }
                }
                for (const prop of pointProps) {
                    if ($this[`${prop}X`] !== undefined) {
                        this._sprite[prop].x = $this[`${prop}X`];
                    }
                    if ($this[`${prop}Y`] !== undefined) {
                        this._sprite[prop].y = $this[`${prop}Y`];
                    }
                }
                this.width = this._sprite.width;
                this.container.addChild(this._sprite);
            }
        }
        afterDetach() {
            if (this.container && this._sprite) {
                this.container.removeChild(this._sprite);
                this._sprite.destroy();
                this._sprite = null;
            }
        }
    };
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", pixi_js_1.Container)
    ], PixiSprite.prototype, "container", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", String)
    ], PixiSprite.prototype, "src", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "alpha", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "buttomMode", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "cacheAsBitmap", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", String)
    ], PixiSprite.prototype, "cursor", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", pixi_js_1.Rectangle)
    ], PixiSprite.prototype, "filterArea", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Array)
    ], PixiSprite.prototype, "filters", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Object)
    ], PixiSprite.prototype, "hitArea", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "interactive", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", pixi_js_1.Graphics)
    ], PixiSprite.prototype, "mask", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", String)
    ], PixiSprite.prototype, "name", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "pivotX", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "pivotY", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "positionX", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "positionY", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "renderable", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "rotation", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "scaleX", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "scaleY", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "skewX", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "skewY", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", pixi_js_1.TransformBase)
    ], PixiSprite.prototype, "transform", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "visible", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "x", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "y", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "zIndex", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "height", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "interactiveChildren", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "sortableChildren", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "sortDirty", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "width", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", pixi_js_1.ObservablePoint)
    ], PixiSprite.prototype, "anchor", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "blendMode", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", String)
    ], PixiSprite.prototype, "pluginName", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], PixiSprite.prototype, "roundPixels", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Object)
    ], PixiSprite.prototype, "shader", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", pixi_js_1.Texture)
    ], PixiSprite.prototype, "texture", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Number)
    ], PixiSprite.prototype, "tint", void 0);
    PixiSprite = tslib_1.__decorate([
        runtime_1.customElement({ name: 'pixi-sprite', template: '<template></template>' }),
        tslib_1.__metadata("design:paramtypes", [])
    ], PixiSprite);
    exports.PixiSprite = PixiSprite;
    for (const prop of directProps) {
        PixiSprite.prototype[`${prop}Changed`] = function (newValue) {
            if ((this.$controller.state & 4 /* isBound */) > 0 && this.sprite != null) {
                this.sprite[prop] = newValue;
            }
        };
    }
    for (const prop of pointProps) {
        PixiSprite.prototype[`${prop}XChanged`] = function (newValue) {
            if ((this.$controller.state & 4 /* isBound */) > 0 && this.sprite != null) {
                this.sprite[prop].x = newValue;
            }
        };
        PixiSprite.prototype[`${prop}YChanged`] = function (newValue) {
            if ((this.$controller.state & 4 /* isBound */) > 0 && this.sprite != null) {
                this.sprite[prop].y = newValue;
            }
        };
    }
});
//# sourceMappingURL=pixi-sprite.js.map
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./viewport-instruction"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const viewport_instruction_1 = require("./viewport-instruction");
    class InstructionResolver {
        constructor() {
            this.separators = {
                viewport: '@',
                sibling: '+',
                scope: '/',
                scopeStart: '(',
                scopeEnd: ')',
                noScope: '!',
                parameters: '(',
                parametersEnd: ')',
                parameter: '&',
                add: '+',
                clear: '-',
                action: '.',
            };
        }
        activate(options) {
            options = options || {};
            this.separators = { ...this.separators, ...options.separators };
        }
        get clearViewportInstruction() {
            return this.separators.clear;
        }
        parseViewportInstructions(instructions) {
            return this.parseViewportInstructionsWorker(instructions, true).instructions;
        }
        parseViewportInstruction(instruction) {
            const instructions = this.parseViewportInstructions(instruction);
            if (instructions.length) {
                return instructions[0];
            }
            return new viewport_instruction_1.ViewportInstruction('');
        }
        stringifyViewportInstructions(instructions, excludeViewport = false) {
            return instructions.map((instruction) => this.stringifyViewportInstruction(instruction, excludeViewport)).join(this.separators.sibling);
        }
        stringifyViewportInstruction(instruction, excludeViewport = false) {
            if (typeof instruction === 'string') {
                return this.stringifyAViewportInstruction(instruction, excludeViewport);
            }
            else {
                let stringified = this.stringifyAViewportInstruction(instruction, excludeViewport);
                if (instruction.nextScopeInstructions && instruction.nextScopeInstructions.length) {
                    stringified += instruction.nextScopeInstructions.length === 1
                        ? `${this.separators.scope}${this.stringifyViewportInstructions(instruction.nextScopeInstructions, excludeViewport)}`
                        : `${this.separators.scope}${this.separators.scopeStart}${this.stringifyViewportInstructions(instruction.nextScopeInstructions, excludeViewport)}${this.separators.scopeEnd}`;
                }
                return stringified;
            }
        }
        stringifyScopedViewportInstructions(instructions) {
            if (!Array.isArray(instructions)) {
                return this.stringifyScopedViewportInstructions([instructions]);
            }
            return instructions.map((instruction) => this.stringifyViewportInstruction(instruction)).join(this.separators.scope);
        }
        encodeViewportInstructions(instructions) {
            return encodeURIComponent(this.stringifyViewportInstructions(instructions)).replace(/\(/g, '%28').replace(/\)/g, '%29');
        }
        decodeViewportInstructions(instructions) {
            return this.parseViewportInstructions(decodeURIComponent(instructions));
        }
        buildScopedLink(scopeContext, href) {
            if (scopeContext) {
                href = `/${scopeContext}${this.separators.scope}${href}`;
            }
            return href;
        }
        shouldClearViewports(path) {
            const clearViewports = (path === this.separators.clear || path.startsWith(this.separators.clear + this.separators.add));
            const newPath = path.startsWith(this.separators.clear) ? path.slice(2) : path;
            return { clear: clearViewports, newPath };
        }
        mergeViewportInstructions(instructions) {
            const merged = [];
            for (let instruction of instructions) {
                if (typeof instruction === 'string') {
                    instruction = this.parseViewportInstruction(instruction);
                }
                const index = merged.findIndex(merge => merge.sameViewport(instruction));
                if (index >= 0) {
                    merged.splice(index, 1, instruction);
                }
                else {
                    merged.push(instruction);
                }
            }
            return merged;
        }
        removeStateDuplicates(states) {
            let sorted = states.slice().sort((a, b) => b.split(this.separators.scope).length - a.split(this.separators.scope).length);
            sorted = sorted.map((value) => `${this.separators.scope}${value}${this.separators.scope}`);
            let unique = [];
            if (sorted.length) {
                unique.push(sorted.shift());
                while (sorted.length) {
                    const state = sorted.shift();
                    if (state && unique.every(value => {
                        return value.indexOf(state) === -1;
                    })) {
                        unique.push(state);
                    }
                }
            }
            unique = unique.map((value) => value.substring(1, value.length - 1));
            unique.sort((a, b) => a.split(this.separators.scope).length - b.split(this.separators.scope).length);
            return unique;
        }
        flattenViewportInstructions(instructions) {
            const flat = [];
            for (const instruction of instructions) {
                flat.push(instruction);
                if (instruction.nextScopeInstructions) {
                    flat.push(...this.flattenViewportInstructions(instruction.nextScopeInstructions));
                }
            }
            return flat;
        }
        stateStringsToString(stateStrings, clear = false) {
            const strings = stateStrings.slice();
            if (clear) {
                strings.unshift(this.clearViewportInstruction);
            }
            return strings.join(this.separators.sibling);
        }
        parseViewportInstructionsWorker(instructions, grouped = false) {
            if (!instructions) {
                return { instructions: [], remaining: '' };
            }
            if (instructions.startsWith(this.separators.scopeStart)) {
                instructions = `${this.separators.scope}${instructions}`;
            }
            const viewportInstructions = [];
            let guard = 10;
            while (instructions.length && guard) {
                guard--;
                if (instructions.startsWith(this.separators.scope)) {
                    instructions = instructions.slice(this.separators.scope.length);
                    const scopeStart = instructions.startsWith(this.separators.scopeStart);
                    if (scopeStart) {
                        instructions = instructions.slice(this.separators.scopeStart.length);
                    }
                    const { instructions: found, remaining } = this.parseViewportInstructionsWorker(instructions, scopeStart);
                    if (viewportInstructions.length) {
                        viewportInstructions[viewportInstructions.length - 1].nextScopeInstructions = found;
                    }
                    else {
                        viewportInstructions.push(...found);
                    }
                    instructions = remaining;
                }
                else if (instructions.startsWith(this.separators.scopeEnd)) {
                    if (grouped) {
                        instructions = instructions.slice(this.separators.scopeEnd.length);
                    }
                    return { instructions: viewportInstructions, remaining: instructions };
                }
                else if (instructions.startsWith(this.separators.sibling)) {
                    if (!grouped) {
                        return { instructions: viewportInstructions, remaining: instructions };
                    }
                    instructions = instructions.slice(this.separators.sibling.length);
                }
                else {
                    const { instruction: viewportInstruction, remaining } = this.parseAViewportInstruction(instructions);
                    viewportInstructions.push(viewportInstruction);
                    instructions = remaining;
                }
            }
            return { instructions: viewportInstructions, remaining: instructions };
        }
        findNextToken(instruction, tokens) {
            const matches = {};
            // Tokens can have length > 1
            for (const token of tokens) {
                const pos = instruction.indexOf(token);
                if (pos > -1) {
                    matches[token] = instruction.indexOf(token);
                }
            }
            const pos = Math.min(...Object.values(matches));
            for (const token in matches) {
                if (matches[token] === pos) {
                    return { token, pos };
                }
            }
            return { token: '', pos: -1 };
        }
        parseAViewportInstruction(instruction) {
            const seps = this.separators;
            const tokens = [seps.parameters, seps.viewport, seps.noScope, seps.scopeEnd, seps.scope, seps.sibling];
            let { token, pos } = this.findNextToken(instruction, tokens);
            const component = pos !== -1 ? instruction.slice(0, pos) : instruction;
            instruction = pos !== -1 ? instruction.slice(pos + token.length) : '';
            let parametersString = void 0;
            tokens.shift(); // parameters
            if (token === seps.parameters) {
                ({ token, pos } = this.findNextToken(instruction, [seps.parametersEnd]));
                parametersString = instruction.slice(0, pos);
                instruction = instruction.slice(pos + token.length);
                ({ token, pos } = this.findNextToken(instruction, tokens));
                instruction = instruction.slice(token.length);
            }
            let viewport = void 0;
            tokens.shift(); // viewport
            if (token === seps.viewport) {
                ({ token, pos } = this.findNextToken(instruction, tokens));
                viewport = pos !== -1 ? instruction.slice(0, pos) : instruction;
                instruction = pos !== -1 ? instruction.slice(pos + token.length) : '';
            }
            let scope = true;
            tokens.shift(); // noScope
            if (token === seps.noScope) {
                scope = false;
            }
            // Restore token that belongs to next instruction
            if (token === seps.scopeEnd || token === seps.scope || token === seps.sibling) {
                instruction = `${token}${instruction}`;
            }
            return { instruction: new viewport_instruction_1.ViewportInstruction(component, viewport, parametersString, scope), remaining: instruction };
        }
        stringifyAViewportInstruction(instruction, excludeViewport = false) {
            if (typeof instruction === 'string') {
                return this.stringifyViewportInstruction(this.parseViewportInstruction(instruction), excludeViewport);
            }
            else {
                let instructionString = instruction.componentName;
                if (instruction.parametersString) {
                    // TODO: Review parameters in ViewportInstruction
                    instructionString += this.separators.parameters + instruction.parametersString + this.separators.parametersEnd;
                }
                if (instruction.viewportName !== null && !excludeViewport) {
                    instructionString += this.separators.viewport + instruction.viewportName;
                }
                if (!instruction.ownsScope) {
                    instructionString += this.separators.noScope;
                }
                return instructionString || '';
            }
        }
    }
    exports.InstructionResolver = InstructionResolver;
});
//# sourceMappingURL=instruction-resolver.js.map
/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ─────────────────────────────────────────
    // SECTION: One Clock Tick
    // ─────────────────────────────────────────
    clockTickSeedValue: {
        defaultValue: 13,
        type: 'number',
        label: 'Starting state',
        description: 'The four-bit state the one-clock-tick register starts from, as a number 0-15',
        min: 0,
        max: 15,
        step: 1,
        color: '#AC8BF9',
    },
    clockTickCount: {
        defaultValue: 0,
        type: 'number',
        label: 'Clock ticks',
        description: 'How many clock ticks the register has taken from its starting state',
        min: 0,
        max: 12,
        step: 1,
        color: '#F7B23B',
    },
    clockTickHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Clock tick highlight',
        description: 'Active highlight id in the one-clock-tick figure (taps, feedback, output)',
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.2)',
    },
    answer_clock_tick_next_state: {
        defaultValue: '',
        type: 'text',
        label: 'Next state answer',
        description: 'Student answer for the state one tick after 0110',
        placeholder: '????',
        correctAnswer: '1011',
        color: '#AC8BF9',
        bgColor: 'rgba(172, 139, 249, 0.15)',
    },
    answer_clock_tick_feedback_destination: {
        defaultValue: '',
        type: 'select',
        label: 'Feedback destination answer',
        description: 'Student answer for where the XOR result is written',
        placeholder: '???',
        correctAnswer: 'the front cell',
        options: ['the front cell', 'the last cell', 'the output line', 'both tapped cells'],
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.15)',
    },

    // ─────────────────────────────────────────
    // SECTION: Where the XOR Goes
    // ─────────────────────────────────────────
    xorWiringSeedValue: {
        defaultValue: 11,
        type: 'number',
        label: 'Starting state (wiring figure)',
        description: 'The four-bit state the tap-wiring register starts from, as a number 0-15',
        min: 0,
        max: 15,
        step: 1,
        color: '#AC8BF9',
    },
    xorWiringTapMask: {
        defaultValue: 9,
        type: 'number',
        label: 'Tap mask',
        description: 'Bit i-1 of this mask is set when cell i is wired to the XOR gate, so 9 means cells 1 and 4',
        min: 0,
        max: 15,
        step: 1,
        color: '#62D0AD',
    },
    xorWiringCount: {
        defaultValue: 0,
        type: 'number',
        label: 'Clock ticks (wiring figure)',
        description: 'How many ticks the tap-wiring register has taken',
        min: 0,
        max: 12,
        step: 1,
        color: '#F7B23B',
    },
    xorWiringHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Tap wiring highlight',
        description: 'Active highlight id in the tap-wiring figure (taps, feedback, output)',
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.2)',
    },
    answer_xor_wiring_next_state: {
        defaultValue: '',
        type: 'text',
        label: 'Wiring next state answer',
        description: 'Student answer for the state after one tick of 1100 tapped at cells 2 and 3',
        placeholder: '????',
        correctAnswer: '1110',
        color: '#AC8BF9',
        bgColor: 'rgba(172, 139, 249, 0.15)',
    },
    answer_xor_wiring_read_timing: {
        defaultValue: '',
        type: 'select',
        label: 'Tap reading timing answer',
        description: 'Student answer for when the tapped cells are read',
        placeholder: '???',
        correctAnswer: 'before the bits move',
        options: ['before the bits move', 'after the bits move', 'as the new bit reaches the front'],
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.15)',
    },
    answer_xor_tap_polynomial: {
        defaultValue: '',
        type: 'select',
        label: 'Tap polynomial answer',
        description: 'Student answer for the missing term of the tap polynomial when cells 1 and 4 are wired',
        placeholder: '???',
        correctAnswer: 'x⁴',
        options: ['x²', 'x³', 'x⁴', 'x⁵'],
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.15)',
    },

    // ─────────────────────────────────────────
    // SECTION: The Sequence Comes Back Around
    // ─────────────────────────────────────────
    cycleSeedValue: {
        defaultValue: 1,
        type: 'number',
        label: 'Starting state',
        description: 'The four-bit state the ring figure starts from, as a number 0-15',
        min: 0,
        max: 15,
        step: 1,
        color: '#AC8BF9',
    },
    cycleCount: {
        defaultValue: 0,
        type: 'number',
        label: 'Clock ticks (ring figure)',
        description: 'How many ticks the register has taken around the state ring',
        min: 0,
        max: 15,
        step: 1,
        color: '#F7B23B',
    },
    cycleHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'State ring highlight',
        description: 'Shared highlight id linking the ring and the register (current, trail, zerostate)',
        color: '#F7B23B',
        bgColor: 'rgba(247, 178, 59, 0.2)',
    },
    registerDegree: {
        defaultValue: 4,
        type: 'number',
        label: 'Register degree',
        description: 'The number of cells n in a maximal-length register',
        min: 2,
        max: 16,
        step: 1,
        color: '#62CCF9',
    },
    registerPeriod: {
        defaultValue: 15,
        type: 'number',
        label: 'Maximal period',
        description: 'Derived: 2^n - 1 for the current register degree',
        min: 3,
        max: 65535,
        step: 1,
        color: '#F7B23B',
    },
    answer_cycle_five_cell_ones: {
        defaultValue: '',
        type: 'text',
        label: 'Five-cell ones answer',
        description: 'Student answer for how many ones one full period of a five-cell m-sequence contains',
        placeholder: '??',
        correctAnswer: '16',
        color: '#F7B23B',
        bgColor: 'rgba(247, 178, 59, 0.15)',
    },
    answer_cycle_zero_seed: {
        defaultValue: '',
        type: 'select',
        label: 'All-zeros seed answer',
        description: 'Student answer for what an all-zeros starting state produces',
        placeholder: '???',
        correctAnswer: 'zeros for ever',
        options: ['zeros for ever', 'the full fifteen-state loop', 'the same stream as any other start'],
        color: '#AC8BF9',
        bgColor: 'rgba(172, 139, 249, 0.15)',
    },

    // ─────────────────────────────────────────
    // SECTION: One Stream, Both Ends
    // ─────────────────────────────────────────
    bothEndsMessage: {
        defaultValue: 178,
        type: 'number',
        label: 'Message bits',
        description: 'The eight-bit message, held as a number 0-255',
        min: 0,
        max: 255,
        step: 1,
        color: '#F8A0CD',
    },
    bothEndsSeed: {
        defaultValue: 6,
        type: 'number',
        label: 'Shared starting state',
        description: 'The four-bit seed both registers start from, as a number 1-15',
        min: 1,
        max: 15,
        step: 1,
        color: '#AC8BF9',
    },
    bothEndsFlips: {
        defaultValue: 0,
        type: 'number',
        label: 'Bits flipped',
        description: 'How many message bits the student has flipped in the sender-receiver figure',
        min: 0,
        max: 99,
        step: 1,
    },
    bothEndsHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Sender-receiver highlight',
        description: 'Shared highlight id linking the sender and receiver views (message, keystream, sent, bit-0 to bit-7)',
        color: '#8E90F5',
        bgColor: 'rgba(142, 144, 245, 0.2)',
    },
    answer_both_ends_sent_bit: {
        defaultValue: '',
        type: 'text',
        label: 'Sent bit answer',
        description: 'Student answer for the bit sent when message bit and keystream bit are both 1',
        placeholder: '?',
        correctAnswer: '0',
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.15)',
    },
    answer_both_ends_shared: {
        defaultValue: '',
        type: 'select',
        label: 'Shared secret answer',
        description: 'Student answer for what the two ends must share',
        placeholder: '???',
        correctAnswer: 'the taps and the starting state',
        options: ['the taps and the starting state', 'the message itself', 'the scrambled bits', 'a stored table of noise'],
        color: '#62D0AD',
        bgColor: 'rgba(98, 208, 173, 0.15)',
    },
    answer_both_ends_involution: {
        defaultValue: '',
        type: 'select',
        label: 'Involution answer',
        description: 'Student answer for the value of z XOR z inside the decryption identity',
        placeholder: '???',
        correctAnswer: '0',
        options: ['0', '1', 'z', 'm'],
        color: '#8E90F5',
        bgColor: 'rgba(142, 144, 245, 0.15)',
    },

    // ========================================
    // ADD YOUR VARIABLES HERE
    // ========================================

    // Uncomment and modify these examples for your lesson:

    /*
    // ─────────────────────────────────────────
    // NUMBER - Use with sliders
    // ─────────────────────────────────────────
    myValue: {
        defaultValue: 5,
        type: 'number',
        label: 'My Value',
        description: 'A number that controls something',
        unit: 'm',           // optional unit display
        min: 0,
        max: 10,
        step: 0.5,
    },

    // ─────────────────────────────────────────
    // TEXT - Free text input
    // ─────────────────────────────────────────
    lessonTitle: {
        defaultValue: 'My Lesson',
        type: 'text',
        label: 'Lesson Title',
        description: 'The title of your lesson',
        placeholder: 'Enter a title...',
    },

    // ─────────────────────────────────────────
    // SELECT - Dropdown with options
    // ─────────────────────────────────────────
    difficulty: {
        defaultValue: 'medium',
        type: 'select',
        label: 'Difficulty',
        description: 'The difficulty level of the lesson',
        options: ['easy', 'medium', 'hard', 'expert'],
    },

    // ─────────────────────────────────────────
    // BOOLEAN - Toggle switch
    // ─────────────────────────────────────────
    showHints: {
        defaultValue: true,
        type: 'boolean',
        label: 'Show Hints',
        description: 'Toggle to show or hide hints',
    },

    // ─────────────────────────────────────────
    // ARRAY - List of numbers
    // ─────────────────────────────────────────
    dataPoints: {
        defaultValue: [1, 4, 9, 16, 25],
        type: 'array',
        label: 'Data Points',
        description: 'Y-values for plotting a graph',
    },

    // ─────────────────────────────────────────
    // OBJECT - Complex structured data
    // ─────────────────────────────────────────
    graphSettings: {
        defaultValue: { 
            xMin: -10, 
            xMax: 10, 
            showGrid: true 
        },
        type: 'object',
        label: 'Graph Settings',
        description: 'Configuration for the graph display',
        schema: '{ xMin: number, xMax: number, showGrid: boolean }',
    },
    */
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}

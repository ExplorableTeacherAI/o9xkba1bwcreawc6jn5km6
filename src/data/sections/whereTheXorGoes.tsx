import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineLinkedHighlight,
    InlineClozeInput,
    InlineClozeChoice,
    InlineFeedback,
    InlineTooltip,
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import { LFSR, bitsOfState, stateOfBits, tapsOfMask, tapPolynomial } from "../lfsrPalette";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
} from "../variables";

// ── Domain model: a 4-bit register whose taps the student wires up ───────────
// The tap mask is a number: bit i-1 set means cell i feeds the XOR gate.

const CELL_COUNT = 4;
const DEFAULT_SEED = 11; // 1011
const DEFAULT_MASK = 9; // cells 1 and 4, so f(x) = 1 + x + x^4

function feedbackBit(bits: number[], taps: number[]): number {
    return bits.reduce((acc, bit, index) => (taps[index] === 1 ? acc ^ bit : acc), 0);
}

function stateAfter(seed: number, taps: number[], ticks: number): { bits: number[]; output: number | null } {
    let bits = bitsOfState(seed);
    let output: number | null = null;
    for (let i = 0; i < ticks; i += 1) {
        const feedback = feedbackBit(bits, taps);
        output = bits[CELL_COUNT - 1];
        bits = [feedback, ...bits.slice(0, CELL_COUNT - 1)];
    }
    return { bits, output };
}

// ── Drawing geometry ─────────────────────────────────────────────────────────

const VIEW_W = 560;
const VIEW_H = 296;
const PITCH = 70;
const CELL_W = 58;
const CELL_H = 58;
const CELL_X0 = 152;
const CELL_Y = 90;
const PAD = 24;
const BUS_Y = 204;
const GATE_X = 286;
const GATE_Y = 236;
const CLIP_Y = 178;

const cellX = (index: number) => CELL_X0 + index * PITCH;
const cellCenterX = (index: number) => cellX(index) + CELL_W / 2;

function TapWiringDrawing() {
    const setVar = useSetVar();
    const seed = useVar<number>("xorWiringSeedValue", DEFAULT_SEED);
    const mask = useVar<number>("xorWiringTapMask", DEFAULT_MASK);
    const ticks = useVar<number>("xorWiringCount", 0);
    const highlight = useVar<string>("xorWiringHighlight", "");

    const taps = tapsOfMask(mask);
    const { bits, output } = stateAfter(seed, taps, ticks);
    const incoming = feedbackBit(bits, taps);
    const tappedBits = bits.filter((_, index) => taps[index] === 1);

    const springTicks = useSpring(ticks, { stiffness: 220, damping: 26 });
    const progress = clamp(1 - (ticks - springTicks), 0, 1);
    const slide = -PITCH * (1 - progress);

    const recede = highlight ? 0.38 : 1;
    const dim = (id: string) => (highlight && highlight !== id ? 0.38 : 1);
    const isOn = (id: string) => highlight === id;
    const ease = { transition: "opacity 150ms ease-out, stroke-width 150ms ease-out" };
    const hover = (id: string) => ({
        onPointerEnter: () => setVar("xorWiringHighlight", id),
        onPointerLeave: () => setVar("xorWiringHighlight", ""),
    });

    const toggleTap = (index: number) => {
        setVar("xorWiringTapMask", mask ^ (1 << index));
        setVar("xorWiringSeedValue", stateOfBits(bits));
        setVar("xorWiringCount", 0);
    };

    const flipCell = (index: number) => {
        const next = bits.slice();
        next[index] = next[index] === 1 ? 0 : 1;
        setVar("xorWiringSeedValue", stateOfBits(next));
        setVar("xorWiringCount", 0);
    };

    const wirePath = (index: number) =>
        `M ${cellCenterX(index)} ${CELL_Y + CELL_H} V ${BUS_Y} H ${GATE_X} V ${GATE_Y - 16}`;
    const feedbackPath = `M ${GATE_X - 16} ${GATE_Y} H 118 V ${CELL_Y + CELL_H / 2} H 144`;
    const sumLabel = tappedBits.length === 0
        ? "no taps = 0"
        : `${tappedBits.join(" ⊕ ")} = ${incoming}`;

    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
            <text
                x={PAD}
                y={40}
                fill={LFSR.state}
                fontSize="12"
                opacity={recede}
                style={{ ...ease, fontVariantNumeric: "tabular-nums" }}
            >
                {`state  ${bits.join("")}`}
            </text>
            <text
                x={VIEW_W / 2}
                y={40}
                textAnchor="middle"
                fill={LFSR.tap}
                fontSize="12"
                opacity={dim("taps")}
                style={{ ...ease, fontVariantNumeric: "tabular-nums" }}
                {...hover("taps")}
            >
                {`f(x) = ${tapPolynomial(mask)}`}
            </text>

            {/* the four cells */}
            <g opacity={recede} style={ease}>
                {[0, 1, 2, 3].map((index) => (
                    <rect
                        key={`cell-${index}`}
                        x={cellX(index)}
                        y={CELL_Y}
                        width={CELL_W}
                        height={CELL_H}
                        rx={8}
                        fill="#FFFFFF"
                        stroke={taps[index] === 1 ? LFSR.tap : LFSR.ink}
                        strokeWidth={taps[index] === 1 ? 3 : 2}
                        style={{ cursor: "pointer" }}
                        onClick={() => flipCell(index)}
                    />
                ))}
                {[0, 1, 2, 3].map((index) => (
                    <text
                        key={`label-${index}`}
                        x={cellCenterX(index)}
                        y={CELL_Y - 12}
                        textAnchor="middle"
                        fill={LFSR.ink}
                        fontSize="11"
                    >
                        {`b${index + 1}`}
                    </text>
                ))}
            </g>

            {/* the wires under each cell, clipped on or hanging loose */}
            <g opacity={dim("taps")} style={ease} {...hover("taps")}>
                {[0, 1, 2, 3].map((index) => (
                    <g key={`wire-${index}`}>
                        {taps[index] === 1 ? (
                            <>
                                {isOn("taps") && (
                                    <path d={wirePath(index)} fill="none" stroke={LFSR.tap} strokeWidth={9} opacity={0.28} strokeLinecap="round" />
                                )}
                                <path
                                    d={wirePath(index)}
                                    fill="none"
                                    stroke={LFSR.tap}
                                    strokeWidth={isOn("taps") ? 4 : 2.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={ease}
                                />
                            </>
                        ) : (
                            <line
                                x1={cellCenterX(index)}
                                y1={CELL_Y + CELL_H}
                                x2={cellCenterX(index)}
                                y2={CLIP_Y - 9}
                                stroke={LFSR.ink}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                strokeLinecap="round"
                            />
                        )}
                        <circle
                            cx={cellCenterX(index)}
                            cy={CLIP_Y}
                            r={9}
                            fill={taps[index] === 1 ? LFSR.tap : "#FFFFFF"}
                            stroke={taps[index] === 1 ? LFSR.tap : LFSR.ink}
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleTap(index)}
                        />
                    </g>
                ))}
                <circle
                    cx={GATE_X}
                    cy={GATE_Y}
                    r={16}
                    fill="#FFFFFF"
                    stroke={LFSR.tap}
                    strokeWidth={isOn("taps") ? 4 : 2.5}
                    style={ease}
                />
                <line x1={GATE_X - 11} y1={GATE_Y} x2={GATE_X + 11} y2={GATE_Y} stroke={LFSR.tap} strokeWidth={2} />
                <line x1={GATE_X} y1={GATE_Y - 11} x2={GATE_X} y2={GATE_Y + 11} stroke={LFSR.tap} strokeWidth={2} />
                <text x={GATE_X + 26} y={GATE_Y + 4} fill={LFSR.tap} fontSize="12">
                    XOR
                </text>
                <text
                    x={GATE_X}
                    y={GATE_Y + 36}
                    textAnchor="middle"
                    fill={LFSR.tap}
                    fontSize="12"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {sumLabel}
                </text>
            </g>

            {/* the feedback wire back to the front cell */}
            <g opacity={dim("feedback")} style={ease} {...hover("feedback")}>
                {isOn("feedback") && (
                    <path d={feedbackPath} fill="none" stroke={LFSR.state} strokeWidth={9} opacity={0.28} strokeLinecap="round" />
                )}
                <path
                    d={feedbackPath}
                    fill="none"
                    stroke={LFSR.state}
                    strokeWidth={isOn("feedback") ? 4 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={ease}
                />
                <path
                    d={`M 144 ${CELL_Y + CELL_H / 2 - 6} L 152 ${CELL_Y + CELL_H / 2} L 144 ${CELL_Y + CELL_H / 2 + 6} Z`}
                    fill={LFSR.state}
                />
                <text x={166} y={258} textAnchor="middle" fill={LFSR.state} fontSize="11">
                    feedback
                </text>
            </g>

            {/* the output line */}
            <g opacity={dim("output")} style={ease} {...hover("output")}>
                {isOn("output") && (
                    <line
                        x1={cellX(3) + CELL_W + 6}
                        y1={CELL_Y + CELL_H / 2}
                        x2={VIEW_W - PAD - 40}
                        y2={CELL_Y + CELL_H / 2}
                        stroke={LFSR.output}
                        strokeWidth={9}
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={cellX(3) + CELL_W + 6}
                    y1={CELL_Y + CELL_H / 2}
                    x2={VIEW_W - PAD - 40}
                    y2={CELL_Y + CELL_H / 2}
                    stroke={LFSR.output}
                    strokeWidth={isOn("output") ? 4 : 2.5}
                    strokeLinecap="round"
                    style={ease}
                />
                <text x={VIEW_W - PAD} y={CELL_Y + CELL_H / 2 + 4} textAnchor="end" fill={LFSR.output} fontSize="12">
                    out
                </text>
            </g>

            {/* the bits, sliding one cell to the right on every tick */}
            <g transform={`translate(${slide} 0)`} opacity={recede} style={ease}>
                {bits.map((bit, index) => (
                    <g key={`bit-${index}`} opacity={index === 0 ? 0.3 + 0.7 * progress : 1}>
                        <rect
                            x={cellX(index) + 8}
                            y={CELL_Y + 8}
                            width={CELL_W - 16}
                            height={CELL_H - 16}
                            rx={7}
                            fill={index === 0 && ticks > 0 ? LFSR.state : LFSR.rest}
                        />
                        <text
                            x={cellCenterX(index)}
                            y={CELL_Y + CELL_H / 2 + 6}
                            textAnchor="middle"
                            fill={index === 0 && ticks > 0 ? "#FFFFFF" : LFSR.inkDark}
                            fontSize="18"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {bit}
                        </text>
                    </g>
                ))}
                {output !== null && progress < 1 && (
                    <g opacity={1 - progress}>
                        <rect
                            x={cellX(4) + 8}
                            y={CELL_Y + 8}
                            width={CELL_W - 16}
                            height={CELL_H - 16}
                            rx={7}
                            fill={LFSR.output}
                        />
                        <text
                            x={cellCenterX(4)}
                            y={CELL_Y + CELL_H / 2 + 6}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="18"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {output}
                        </text>
                    </g>
                )}
            </g>
        </svg>
    );
}

function TapWiringFigure() {
    const setVar = useSetVar();
    const ticks = useVar<number>("xorWiringCount", 0);

    return (
        <Figure
            id="tap-wiring"
            onReset={() => {
                setVar("xorWiringSeedValue", DEFAULT_SEED);
                setVar("xorWiringTapMask", DEFAULT_MASK);
                setVar("xorWiringCount", 0);
            }}
            caption="Clip a wire onto the XOR gate by clicking the round end under any cell, and the tap polynomial above rewrites itself. Clicking a cell flips its bit, and the clock takes one tick."
        >
            <TapWiringDrawing />
            <div className="flex items-center justify-center gap-3 px-6 pb-5">
                <button
                    type="button"
                    onClick={() => setVar("xorWiringCount", Math.min(ticks + 1, 12))}
                    className="rounded-lg bg-[#62D0AD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4FBE9B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62D0AD]"
                >
                    Clock tick
                </button>
                <span className="text-xs text-[#64748B]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`${ticks} tick${ticks === 1 ? "" : "s"} taken`}
                </span>
            </div>
            <InteractionHintSequence
                hintKey="tap-wiring-clip"
                steps={[
                    { gesture: "click", label: "Click a round wire end to clip it onto the XOR gate", position: { x: "58%", y: "58%" } },
                    { gesture: "click", label: "Press the clock and read the bit that arrives at the front", position: { x: "44%", y: "86%" } },
                ]}
            />
        </Figure>
    );
}

export const whereTheXorGoesBlocks: ReactElement[] = [
    <StackLayout key="layout-xor-wiring-heading" maxWidth="xl">
        <Block id="xor-wiring-heading" padding="md">
            <EditableH2 id="h2-xor-wiring-heading" blockId="xor-wiring-heading">
                Where the XOR Goes
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-rules" maxWidth="xl">
        <Block id="xor-wiring-rules" padding="sm">
            <EditableParagraph id="para-xor-wiring-rules" blockId="xor-wiring-rules">
                The XOR gate is the easy part. What defines the circuit is{" "}
                <InlineLinkedHighlight
                    id="link-xor-wiring-taps"
                    varName="xorWiringHighlight"
                    highlightId="taps"
                    color={LFSR.tap}
                    bgColor="rgba(98, 208, 173, 0.2)"
                >
                    which cells feed it
                </InlineLinkedHighlight>
                , written as a coefficient c<sub>i</sub> per cell and collected into the{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-xor-tap-polynomial" tooltip="The tap polynomial f(x) = 1 + c₁x + c₂x² + ... + cₙxⁿ over GF(2). Its algebraic properties, not the circuit layout, decide how long the output sequence runs before repeating.">
                    tap polynomial
                </InlineTooltip>
                . Those cells are read while the register still holds its old bits, and the result
                enters{" "}
                <InlineLinkedHighlight
                    id="link-xor-wiring-feedback"
                    varName="xorWiringHighlight"
                    highlightId="feedback"
                    color={LFSR.state}
                    bgColor="rgba(172, 139, 249, 0.2)"
                >
                    at the front
                </InlineLinkedHighlight>
                , never at the tail where the output leaves.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-polynomial" maxWidth="xl">
        <Block id="xor-wiring-polynomial" padding="lg">
            <FormulaBlock
                latex="\clr{state}{b_1^+} = \clr{tap}{c_1} b_1 \oplus \clr{tap}{c_2} b_2 \oplus \clr{tap}{c_3} b_3 \oplus \clr{tap}{c_4} b_4 \qquad \clr{tap}{f(x)} = 1 \oplus \clr{tap}{c_1} x \oplus \clr{tap}{c_2} x^2 \oplus \clr{tap}{c_3} x^3 \oplus \clr{tap}{c_4} x^4"
                colorMap={{ state: LFSR.state, tap: LFSR.tap }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-worked-example" maxWidth="xl">
        <Block id="xor-wiring-worked-example" padding="sm">
            <EditableParagraph id="para-xor-wiring-worked-example" blockId="xor-wiring-worked-example">
                Wired to cells 1 and 4 the register carries{" "}
                <InlineTrigger
                    id="trigger-xor-poly-primitive"
                    varName="xorWiringTapMask"
                    value={9}
                    color={LFSR.tap}
                    bgColor="rgba(98, 208, 173, 0.15)"
                >
                    f(x) = 1 + x + x⁴
                </InlineTrigger>
                , so from 1011 the taps read 1 ⊕ 1 = 0, the right-hand 1 leaves as output and the
                0 takes the front seat, giving 0101. Clip any round wire end onto the gate and both
                the polynomial and the fed-back bit rewrite themselves on the spot.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-visual" maxWidth="xl">
        <Block id="xor-wiring-visual" padding="sm" hasVisualization>
            <TapWiringFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-consequence" maxWidth="xl">
        <Block id="xor-wiring-consequence" padding="sm">
            <EditableParagraph id="para-xor-wiring-consequence" blockId="xor-wiring-consequence">
                Not every wiring is worth having. Snap the taps to{" "}
                <InlineTrigger
                    id="trigger-xor-poly-square"
                    varName="xorWiringTapMask"
                    value={10}
                    color={LFSR.tap}
                    bgColor="rgba(98, 208, 173, 0.15)"
                >
                    1 + x² + x⁴
                </InlineTrigger>
                {" "}and the polynomial factors as (1 + x + x²)², collapsing the register onto a
                cycle of length 3; snap them to{" "}
                <InlineTrigger
                    id="trigger-xor-poly-all"
                    varName="xorWiringTapMask"
                    value={15}
                    color={LFSR.tap}
                    bgColor="rgba(98, 208, 173, 0.15)"
                >
                    1 + x + x² + x³ + x⁴
                </InlineTrigger>
                {" "}and it runs for 5. With only sixteen states available, how long can any of
                them keep surprising us?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-question-polynomial" maxWidth="xl">
        <Block id="xor-wiring-question-polynomial" padding="md">
            <EditableParagraph id="para-xor-wiring-question-polynomial" blockId="xor-wiring-question-polynomial">
                Wiring cells 1 and 4 sets c<sub>1</sub> and c<sub>4</sub> to 1 and the rest to 0,
                so the missing term of the tap polynomial is:
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-formula-choice" maxWidth="xl">
        <Block id="xor-wiring-formula-choice" padding="lg">
            <FormulaBlock
                showHint={true}
                latex="\clr{tap}{f(x)} = 1 \oplus x \oplus \choice{answer_xor_tap_polynomial}"
                colorMap={{ tap: LFSR.tap }}
                clozeChoices={{
                    answer_xor_tap_polynomial: {
                        correctAnswer: 'x⁴',
                        options: ['x²', 'x³', 'x⁴', 'x⁵'],
                        placeholder: '???',
                        color: LFSR.tap,
                    },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-question-next-state" maxWidth="xl">
        <Block id="xor-wiring-question-next-state" padding="md">
            <EditableParagraph id="para-xor-wiring-question-next-state" blockId="xor-wiring-question-next-state">
                Wire the taps to cells 2 and 3 instead, hold the register at 1100, and one tick
                later it reads{" "}
                <InlineFeedback
                    varName="answer_xor_wiring_next_state"
                    correctValue="1110"
                    position="terminal"
                    successMessage="— yes: the tapped cells hold 1 and 0, so a 1 is fed back while the right-hand 0 leaves"
                    failureMessage="— close, but check which two bits you XORed."
                    hint="Cells 2 and 3 of 1100 hold 1 and 0, and they are read before anything slides"
                    visualizationHint={{
                        blockId: "xor-wiring-visual",
                        hintKey: "feedback-xor-wiring-next-state",
                        label: "Wire it up and check",
                        steps: [
                            {
                                gesture: "click",
                                label: "The taps are now on cells 2 and 3 and the state is 1100 — press the clock once",
                                position: { x: "50%", y: "58%" },
                                completionVar: "xorWiringCount",
                                completionValue: 1,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { xorWiringTapMask: 6, xorWiringSeedValue: 12, xorWiringCount: 0 },
                    }}
                >
                    <InlineClozeInput
                        varName="answer_xor_wiring_next_state"
                        correctAnswer="1110"
                        {...clozePropsFromDefinition(getVariableInfo('answer_xor_wiring_next_state'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-question-timing" maxWidth="xl">
        <Block id="xor-wiring-question-timing" padding="md">
            <EditableParagraph id="para-xor-wiring-question-timing" blockId="xor-wiring-question-timing">
                The values the XOR gate works on are the ones sitting in the tapped cells{" "}
                <InlineFeedback
                    varName="answer_xor_wiring_read_timing"
                    correctValue="before the bits move"
                    position="terminal"
                    successMessage="— exactly, which is why the old b4 still counts on the very tick that carries it away"
                    failureMessage="— not quite, and this is the step that catches most people."
                    hint="Watch the XOR sum under the gate while the bits are still standing still, then press the clock"
                    visualizationHint={{
                        blockId: "xor-wiring-visual",
                        hintKey: "feedback-xor-wiring-timing",
                        label: "Watch the order of events",
                        steps: [
                            {
                                gesture: "click",
                                label: "Note the XOR sum shown under the gate, then press the clock and see that bit arrive",
                                position: { x: "44%", y: "86%" },
                                completionVar: "xorWiringCount",
                                completionValue: 1,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { xorWiringCount: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_xor_wiring_read_timing"
                        correctAnswer="before the bits move"
                        options={["before the bits move", "after the bits move", "as the new bit reaches the front"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_xor_wiring_read_timing'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

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
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── Domain model: a 4-bit register whose taps the student wires up ───────────

const CELL_COUNT = 4;
const DEFAULT_SEED = [1, 0, 1, 1];
const DEFAULT_TAPS = [1, 0, 0, 1];

function feedbackBit(bits: number[], taps: number[]): number {
    return bits.reduce((acc, bit, index) => (taps[index] === 1 ? acc ^ bit : acc), 0);
}

function stateAfter(seed: number[], taps: number[], ticks: number): { bits: number[]; output: number | null } {
    let bits = seed.slice();
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

const INK = "#64748B";
const INK_DARK = "#334155";
const ACCENT = "#62D0AD";
const PARTNER = "#8E90F5";

const cellX = (index: number) => CELL_X0 + index * PITCH;
const cellCenterX = (index: number) => cellX(index) + CELL_W / 2;

function TapWiringDrawing() {
    const setVar = useSetVar();
    const seedRaw = useVar<number[]>("xorWiringSeed", DEFAULT_SEED);
    const tapsRaw = useVar<number[]>("xorWiringTaps", DEFAULT_TAPS);
    const ticks = useVar<number>("xorWiringCount", 0);
    const highlight = useVar<string>("xorWiringHighlight", "");

    const seed = Array.isArray(seedRaw) && seedRaw.length === CELL_COUNT ? seedRaw : DEFAULT_SEED;
    const taps = Array.isArray(tapsRaw) && tapsRaw.length === CELL_COUNT ? tapsRaw : DEFAULT_TAPS;
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
        const next = taps.slice();
        next[index] = next[index] === 1 ? 0 : 1;
        setVar("xorWiringTaps", next);
        setVar("xorWiringSeed", bits);
        setVar("xorWiringCount", 0);
    };

    const flipCell = (index: number) => {
        const next = bits.slice();
        next[index] = next[index] === 1 ? 0 : 1;
        setVar("xorWiringSeed", next);
        setVar("xorWiringCount", 0);
    };

    const wirePath = (index: number) =>
        `M ${cellCenterX(index)} ${CELL_Y + CELL_H} V ${BUS_Y} H ${GATE_X} V ${GATE_Y - 16}`;
    const feedbackPath = `M ${GATE_X - 16} ${GATE_Y} H 118 V ${CELL_Y + CELL_H / 2} H 144`;
    const sumLabel = tappedBits.length === 0
        ? "no cells tapped  =  0"
        : `${tappedBits.join(" XOR ")}  =  ${incoming}`;

    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
            <text
                x={PAD}
                y={40}
                fill={INK_DARK}
                fontSize="12"
                opacity={recede}
                style={{ ...ease, fontVariantNumeric: "tabular-nums" }}
            >
                {`register  ${bits.join("")}`}
            </text>
            <text
                x={VIEW_W - PAD}
                y={40}
                textAnchor="end"
                fill={ACCENT}
                fontSize="12"
                opacity={dim("taps")}
                style={{ ...ease, fontVariantNumeric: "tabular-nums" }}
                {...hover("taps")}
            >
                {`feedback  ${sumLabel}`}
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
                        stroke={taps[index] === 1 ? ACCENT : INK}
                        strokeWidth={taps[index] === 1 ? 3 : 2}
                        style={{ cursor: "pointer" }}
                        onClick={() => flipCell(index)}
                    />
                ))}
            </g>

            {/* the wires under each cell, clipped on or hanging loose */}
            <g opacity={dim("taps")} style={ease} {...hover("taps")}>
                {[0, 1, 2, 3].map((index) => (
                    <g key={`wire-${index}`}>
                        {taps[index] === 1 ? (
                            <>
                                {isOn("taps") && (
                                    <path d={wirePath(index)} fill="none" stroke={ACCENT} strokeWidth={9} opacity={0.28} strokeLinecap="round" />
                                )}
                                <path
                                    d={wirePath(index)}
                                    fill="none"
                                    stroke={ACCENT}
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
                                stroke={INK}
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                strokeLinecap="round"
                            />
                        )}
                        <circle
                            cx={cellCenterX(index)}
                            cy={CLIP_Y}
                            r={9}
                            fill={taps[index] === 1 ? ACCENT : "#FFFFFF"}
                            stroke={taps[index] === 1 ? ACCENT : INK}
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
                    stroke={ACCENT}
                    strokeWidth={isOn("taps") ? 4 : 2.5}
                    style={ease}
                />
                <line x1={GATE_X - 11} y1={GATE_Y} x2={GATE_X + 11} y2={GATE_Y} stroke={ACCENT} strokeWidth={2} />
                <line x1={GATE_X} y1={GATE_Y - 11} x2={GATE_X} y2={GATE_Y + 11} stroke={ACCENT} strokeWidth={2} />
                <text x={GATE_X + 26} y={GATE_Y + 4} fill={ACCENT} fontSize="12">
                    XOR
                </text>
            </g>

            {/* the feedback wire back to the front cell */}
            <g opacity={dim("feedback")} style={ease} {...hover("feedback")}>
                {isOn("feedback") && (
                    <path d={feedbackPath} fill="none" stroke={ACCENT} strokeWidth={9} opacity={0.28} strokeLinecap="round" />
                )}
                <path
                    d={feedbackPath}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth={isOn("feedback") ? 4 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={ease}
                />
                <path
                    d={`M 144 ${CELL_Y + CELL_H / 2 - 6} L 152 ${CELL_Y + CELL_H / 2} L 144 ${CELL_Y + CELL_H / 2 + 6} Z`}
                    fill={ACCENT}
                />
                <text x={172} y={258} textAnchor="middle" fill={ACCENT} fontSize="11">
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
                        stroke={PARTNER}
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
                    stroke={PARTNER}
                    strokeWidth={isOn("output") ? 4 : 2.5}
                    strokeLinecap="round"
                    style={ease}
                />
                <text x={VIEW_W - PAD} y={CELL_Y + CELL_H / 2 + 4} textAnchor="end" fill={PARTNER} fontSize="12">
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
                            fill={index === 0 && ticks > 0 ? ACCENT : "#E2E8F0"}
                        />
                        <text
                            x={cellCenterX(index)}
                            y={CELL_Y + CELL_H / 2 + 6}
                            textAnchor="middle"
                            fill={index === 0 && ticks > 0 ? "#FFFFFF" : INK_DARK}
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
                            fill={PARTNER}
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
                setVar("xorWiringSeed", DEFAULT_SEED);
                setVar("xorWiringTaps", DEFAULT_TAPS);
                setVar("xorWiringCount", 0);
            }}
            caption="Clip a wire onto the XOR gate by clicking the round end under any cell. Clicking a cell itself flips its bit, and the clock takes one tick."
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
                The XOR gate is the easy part. What trips people up is{" "}
                <InlineLinkedHighlight
                    id="link-xor-wiring-taps"
                    varName="xorWiringHighlight"
                    highlightId="taps"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('xorWiringHighlight'))}
                >
                    which cells feed it
                </InlineLinkedHighlight>
                {" "}and{" "}
                <InlineLinkedHighlight
                    id="link-xor-wiring-feedback"
                    varName="xorWiringHighlight"
                    highlightId="feedback"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('xorWiringHighlight'))}
                >
                    where its answer lands
                </InlineLinkedHighlight>
                . The tapped cells are read while the register still holds its old bits, before
                anything moves, and the result then enters at the front, never at the tail where
                the output leaves.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-worked-example" maxWidth="xl">
        <Block id="xor-wiring-worked-example" padding="sm">
            <EditableParagraph id="para-xor-wiring-worked-example" blockId="xor-wiring-worked-example">
                So with 1011 tapped at the first and last cells, read those two first: 1 XOR 1 is 0.
                The right-hand 1 leaves as output and the 0 takes the front seat, giving 0101. Clip
                the round wire ends under any cells you like onto the XOR gate and the fed-back bit
                changes on the spot.
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
                Move a tap and the whole stream changes, even from the same starting bits. Which
                raises the awkward question: with only sixteen possible four-bit states, how long
                can such a stream keep surprising us?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-question-next-state" maxWidth="xl">
        <Block id="xor-wiring-question-next-state" padding="md">
            <EditableParagraph id="para-xor-wiring-question-next-state" blockId="xor-wiring-question-next-state">
                Wire the taps to the second and third cells instead, hold the register at 1100, and
                one tick later it reads{" "}
                <InlineFeedback
                    varName="answer_xor_wiring_next_state"
                    correctValue="1110"
                    position="terminal"
                    successMessage="— yes: the tapped cells hold 1 and 0, so a 1 is fed back while the right-hand 0 leaves"
                    failureMessage="— close, but check which two bits you XORed."
                    hint="The second and third cells of 1100 hold 1 and 0, and they are read before anything slides"
                    visualizationHint={{
                        blockId: "xor-wiring-visual",
                        hintKey: "feedback-xor-wiring-next-state",
                        label: "Wire it up and check",
                        steps: [
                            {
                                gesture: "click",
                                label: "Clip the wires so only the second and third cells are tapped, set the bits to 1100, then press the clock",
                                position: { x: "50%", y: "58%" },
                                completionVar: "xorWiringCount",
                                completionValue: 1,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { xorWiringCount: 0 },
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
                    successMessage="— exactly, which is why the old right-hand bit still counts on the tick that carries it away"
                    failureMessage="— not quite, and this is the step that catches most people."
                    hint="Watch the feedback readout while the bits are still standing still, then press the clock"
                    visualizationHint={{
                        blockId: "xor-wiring-visual",
                        hintKey: "feedback-xor-wiring-timing",
                        label: "Watch the order of events",
                        steps: [
                            {
                                gesture: "click",
                                label: "Note the feedback value shown before you tick, then press the clock and see that bit arrive",
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

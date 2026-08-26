import { type ReactElement } from "react";
import { StackLayout, SplitLayout } from "@/components/layouts";
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
import { clamp, lerp, useSpring } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── Domain model: a 4-bit LFSR tapped at the two right-hand cells ────────────
// State is held as a number 0-15 so both views read exactly the same value.

const STATE_COUNT = 16;
const MAX_TICKS = 15;

const bitsOf = (state: number): number[] => [3, 2, 1, 0].map((shift) => (state >> shift) & 1);
const outputOf = (state: number): number => state & 1;
const nextState = (state: number): number => {
    const feedback = ((state >> 1) & 1) ^ (state & 1);
    return (feedback << 3) | (state >> 1);
};

function walk(seed: number, ticks: number): number[] {
    const path = [seed];
    for (let i = 0; i < ticks; i += 1) path.push(nextState(path[path.length - 1]));
    return path;
}

// ── Shared look ──────────────────────────────────────────────────────────────

const INK = "#64748B";
const INK_DARK = "#334155";
const ACCENT = "#62D0AD";
const PARTNER = "#8E90F5";
const EASE = { transition: "opacity 150ms ease-out, stroke-width 150ms ease-out" };

function useSharedHighlight() {
    const highlight = useVar<string>("cycleHighlight", "");
    const setVar = useSetVar();
    return {
        highlight,
        recede: highlight ? 0.38 : 1,
        dim: (id: string) => (highlight && highlight !== id ? 0.38 : 1),
        isOn: (id: string) => highlight === id,
        hover: (id: string) => ({
            onPointerEnter: () => setVar("cycleHighlight", id),
            onPointerLeave: () => setVar("cycleHighlight", ""),
        }),
    };
}

// ── View A: the ring of all sixteen states ───────────────────────────────────

const RING_VIEW = 360;
const RING_C = 180;
const R_DOT = 104;
const R_LABEL = 126;

const ringAngle = (state: number) => (-90 + state * (360 / STATE_COUNT)) * (Math.PI / 180);
const ringX = (state: number, radius: number) => RING_C + radius * Math.cos(ringAngle(state));
const ringY = (state: number, radius: number) => RING_C + radius * Math.sin(ringAngle(state));

function StateRingDrawing() {
    const setVar = useSetVar();
    const seed = useVar<number>("cycleSeedValue", 1);
    const ticks = useVar<number>("cycleCount", 0);
    const { recede, dim, isOn, hover } = useSharedHighlight();

    const path = walk(seed, ticks);
    const visited = new Set(path);
    const springTicks = useSpring(ticks, { stiffness: 200, damping: 26 });
    const progress = clamp(1 - (ticks - springTicks), 0, 1);

    const previous = path.length > 1 ? path[path.length - 2] : path[0];
    const current = path[path.length - 1];
    const markerX = lerp(ringX(previous, R_DOT), ringX(current, R_DOT), progress);
    const markerY = lerp(ringY(previous, R_DOT), ringY(current, R_DOT), progress);

    const trailPoints = [
        ...path.slice(0, Math.max(path.length - 1, 1)).map((state) => `${ringX(state, R_DOT)},${ringY(state, R_DOT)}`),
        `${markerX},${markerY}`,
    ].join(" ");

    return (
        <svg viewBox={`0 0 ${RING_VIEW} ${RING_VIEW}`} className="block w-full">
            {/* the sixteen states */}
            <g opacity={recede} style={EASE}>
                {Array.from({ length: STATE_COUNT }, (_, state) => {
                    const cos = Math.cos(ringAngle(state));
                    const sin = Math.sin(ringAngle(state));
                    const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
                    const labelY = ringY(state, R_LABEL) + (sin < -0.35 ? -6 : sin > 0.35 ? 14 : 4);
                    return (
                        <g key={`state-${state}`}>
                            <circle
                                cx={ringX(state, R_DOT)}
                                cy={ringY(state, R_DOT)}
                                r={visited.has(state) ? 7 : 5}
                                fill={visited.has(state) ? ACCENT : "#FFFFFF"}
                                fillOpacity={visited.has(state) ? 0.55 : 1}
                                stroke={visited.has(state) ? ACCENT : INK}
                                strokeWidth={1.5}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    setVar("cycleSeedValue", state);
                                    setVar("cycleCount", 0);
                                }}
                            />
                            <text
                                x={ringX(state, R_LABEL)}
                                y={labelY}
                                textAnchor={anchor}
                                fill={INK}
                                fontSize="10"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {bitsOf(state).join("")}
                            </text>
                        </g>
                    );
                })}
            </g>

            {/* the trail the register has drawn so far */}
            <g opacity={dim("trail")} style={EASE} {...hover("trail")}>
                {isOn("trail") && ticks > 0 && (
                    <polyline points={trailPoints} fill="none" stroke={ACCENT} strokeWidth={9} opacity={0.28} strokeLinejoin="round" strokeLinecap="round" />
                )}
                {ticks > 0 && (
                    <polyline
                        points={trailPoints}
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth={isOn("trail") ? 4 : 2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        style={EASE}
                    />
                )}
            </g>

            {/* the all-zeros state, which feeds itself */}
            <g opacity={dim("zerostate")} style={EASE} {...hover("zerostate")}>
                {isOn("zerostate") && (
                    <circle cx={ringX(0, R_DOT)} cy={ringY(0, R_DOT) - 13} r={11} fill="none" stroke={INK} strokeWidth={9} opacity={0.28} />
                )}
                <circle
                    cx={ringX(0, R_DOT)}
                    cy={ringY(0, R_DOT) - 13}
                    r={11}
                    fill="none"
                    stroke={INK}
                    strokeWidth={isOn("zerostate") ? 3 : 1.5}
                    style={EASE}
                />
            </g>

            {/* where the register is right now */}
            <g opacity={dim("current")} style={EASE} {...hover("current")}>
                {isOn("current") && <circle cx={markerX} cy={markerY} r={17} fill={ACCENT} opacity={0.28} />}
                <circle cx={markerX} cy={markerY} r={isOn("current") ? 12 : 10} fill={ACCENT} stroke="#FFFFFF" strokeWidth={2} style={EASE} />
            </g>
        </svg>
    );
}

function StateRingFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="state-ring"
            onReset={() => {
                setVar("cycleSeedValue", 1);
                setVar("cycleCount", 0);
            }}
            caption="Every four-bit pattern, one dot each. Click a dot to start the register there and the trail follows it from tick to tick."
        >
            <StateRingDrawing />
            <InteractionHintSequence
                hintKey="state-ring-pick"
                steps={[{ gesture: "click", label: "Click a pattern to start the register there", position: { x: "50%", y: "18%" } }]}
            />
        </Figure>
    );
}

// ── View B: the live register and the bits it has pushed out ─────────────────

const REG_VIEW_W = 360;
const REG_VIEW_H = 176;
const REG_CELL_W = 48;
const REG_CELL_H = 48;
const REG_PITCH = 58;
const REG_X0 = 69;
const REG_Y = 34;
const CHIP_PITCH = 20;

function RegisterAndStreamDrawing() {
    const seed = useVar<number>("cycleSeedValue", 1);
    const ticks = useVar<number>("cycleCount", 0);
    const { recede, dim, isOn, hover } = useSharedHighlight();

    const path = walk(seed, ticks);
    const current = path[path.length - 1];
    const bits = bitsOf(current);
    const stream = path.slice(0, path.length - 1).map(outputOf);
    const visited = new Set(path).size;

    return (
        <svg viewBox={`0 0 ${REG_VIEW_W} ${REG_VIEW_H}`} className="block w-full">
            <text x={24} y={22} fill={INK} fontSize="11" opacity={recede} style={EASE}>
                register
            </text>
            <text
                x={REG_VIEW_W - 24}
                y={22}
                textAnchor="end"
                fill={INK_DARK}
                fontSize="11"
                opacity={recede}
                style={{ ...EASE, fontVariantNumeric: "tabular-nums" }}
            >
                {`${visited} of 15 states visited`}
            </text>

            {/* the four cells — counterpart of the marker on the ring */}
            <g opacity={dim("current")} style={EASE} {...hover("current")}>
                {bits.map((bit, index) => (
                    <g key={`reg-${index}`}>
                        {isOn("current") && (
                            <rect
                                x={REG_X0 + index * REG_PITCH - 3}
                                y={REG_Y - 3}
                                width={REG_CELL_W + 6}
                                height={REG_CELL_H + 6}
                                rx={10}
                                fill="none"
                                stroke={ACCENT}
                                strokeWidth={9}
                                opacity={0.28}
                            />
                        )}
                        <rect
                            x={REG_X0 + index * REG_PITCH}
                            y={REG_Y}
                            width={REG_CELL_W}
                            height={REG_CELL_H}
                            rx={8}
                            fill="#FFFFFF"
                            stroke={ACCENT}
                            strokeWidth={isOn("current") ? 4 : 2.5}
                            style={EASE}
                        />
                        <text
                            x={REG_X0 + index * REG_PITCH + REG_CELL_W / 2}
                            y={REG_Y + REG_CELL_H / 2 + 6}
                            textAnchor="middle"
                            fill={INK_DARK}
                            fontSize="18"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {bit}
                        </text>
                    </g>
                ))}
            </g>

            {/* the output bits so far — counterpart of the trail on the ring */}
            <g opacity={dim("trail")} style={EASE} {...hover("trail")}>
                <text x={24} y={116} fill={PARTNER} fontSize="11" style={EASE}>
                    output so far
                </text>
                {stream.map((bit, index) => (
                    <g key={`chip-${index}`}>
                        <rect
                            x={24 + index * CHIP_PITCH}
                            y={128}
                            width={16}
                            height={16}
                            rx={4}
                            fill={PARTNER}
                            fillOpacity={isOn("trail") ? 0.35 : 0.15}
                            stroke={PARTNER}
                            strokeWidth={isOn("trail") ? 2 : 1.2}
                            style={EASE}
                        />
                        <text
                            x={32 + index * CHIP_PITCH}
                            y={141}
                            textAnchor="middle"
                            fill={INK_DARK}
                            fontSize="11"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {bit}
                        </text>
                    </g>
                ))}
                {stream.length === 0 && (
                    <text x={24} y={141} fill={INK} fontSize="11" opacity={0.7}>
                        nothing yet
                    </text>
                )}
            </g>
        </svg>
    );
}

function RegisterAndStreamFigure() {
    const setVar = useSetVar();
    const ticks = useVar<number>("cycleCount", 0);

    return (
        <Figure
            id="register-and-stream"
            onReset={() => {
                setVar("cycleSeedValue", 1);
                setVar("cycleCount", 0);
            }}
            caption="The same register, in bits. Each tick pushes one more bit onto the strip below it."
        >
            <RegisterAndStreamDrawing />
            <div className="flex items-center justify-center gap-3 px-6 pb-5">
                <button
                    type="button"
                    onClick={() => setVar("cycleCount", Math.min(ticks + 1, MAX_TICKS))}
                    className="rounded-lg bg-[#62D0AD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4FBE9B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62D0AD]"
                >
                    Clock tick
                </button>
                <span className="text-xs text-[#64748B]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`${ticks} of ${MAX_TICKS} ticks`}
                </span>
            </div>
            <InteractionHintSequence
                hintKey="register-and-stream-tick"
                steps={[{ gesture: "click", label: "Press the clock and watch the marker move on the ring", position: { x: "44%", y: "82%" } }]}
            />
        </Figure>
    );
}

export const theSequenceComesBackAroundBlocks: ReactElement[] = [
    <StackLayout key="layout-cycle-heading" maxWidth="xl">
        <Block id="cycle-heading" padding="md">
            <EditableH2 id="h2-cycle-heading" blockId="cycle-heading">
                The Sequence Comes Back Around
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-finite-states" maxWidth="xl">
        <Block id="cycle-finite-states" padding="sm">
            <EditableParagraph id="para-cycle-finite-states" blockId="cycle-finite-states">
                Four cells can hold only sixteen different patterns, and{" "}
                <InlineLinkedHighlight
                    id="link-cycle-current"
                    varName="cycleHighlight"
                    highlightId="current"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('cycleHighlight'))}
                >
                    the pattern it is in now
                </InlineLinkedHighlight>
                {" "}completely fixes the next one. So the register cannot wander forever: sooner
                or later it walks into a pattern it has already been in, and from that moment it is
                locked into a loop.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-zero-trap" maxWidth="xl">
        <Block id="cycle-zero-trap" padding="sm">
            <EditableParagraph id="para-cycle-zero-trap" blockId="cycle-zero-trap">
                One of those sixteen is a trap. XOR a pile of zeros and you get a zero back, so{" "}
                <InlineLinkedHighlight
                    id="link-cycle-zerostate"
                    varName="cycleHighlight"
                    highlightId="zerostate"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('cycleHighlight'))}
                >
                    all-zeros
                </InlineLinkedHighlight>
                {" "}feeds itself and never escapes. Click any pattern on the ring to start the
                register there, then tick the clock and watch the trail hunt its way home.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <SplitLayout key="layout-cycle-visual" ratio="1:1" gap="lg" align="start">
        <Block id="cycle-visual" padding="sm" hasVisualization>
            <StateRingFigure />
        </Block>
        <Block id="cycle-register-view" padding="sm" hasVisualization>
            <RegisterAndStreamFigure />
        </Block>
    </SplitLayout>,

    <StackLayout key="layout-cycle-usefulness" maxWidth="xl">
        <Block id="cycle-usefulness" padding="sm">
            <EditableParagraph id="para-cycle-usefulness" blockId="cycle-usefulness">
                A loop through all fifteen states gives{" "}
                <InlineLinkedHighlight
                    id="link-cycle-trail"
                    varName="cycleHighlight"
                    highlightId="trail"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('cycleHighlight'))}
                >
                    fifteen output bits
                </InlineLinkedHighlight>
                {" "}with a fair mix of ones and zeros, yet anyone who knows the taps and the
                starting bits can reproduce them exactly. Looks random, is not random. That pair is
                what the applications are built on.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-question-five-cells" maxWidth="xl">
        <Block id="cycle-question-five-cells" padding="md">
            <EditableParagraph id="para-cycle-question-five-cells" blockId="cycle-question-five-cells">
                Swap in a five-cell register with equally well-chosen taps and the longest loop it
                can manage runs through{" "}
                <InlineFeedback
                    varName="answer_cycle_five_cell_period"
                    correctValue="31"
                    position="terminal"
                    successMessage="— yes: 32 patterns exist, and the all-zeros one is stranded on its own"
                    failureMessage="— have another think."
                    hint="Count how many patterns five cells can hold, then take away the one that traps the register"
                    visualizationHint={{
                        blockId: "cycle-visual",
                        hintKey: "feedback-cycle-five-cells",
                        label: "Count it on the ring first",
                        steps: [
                            {
                                gesture: "click",
                                label: "Tick the four-cell register right round until the trail closes, and count the dots it reached",
                                position: { x: "50%", y: "50%" },
                                completionVar: "cycleCount",
                                completionValue: 15,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { cycleSeedValue: 1, cycleCount: 0 },
                    }}
                >
                    <InlineClozeInput
                        varName="answer_cycle_five_cell_period"
                        correctAnswer="31"
                        {...clozePropsFromDefinition(getVariableInfo('answer_cycle_five_cell_period'))}
                    />
                </InlineFeedback>
                {" "}states before repeating.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-question-zero-seed" maxWidth="xl">
        <Block id="cycle-question-zero-seed" padding="md">
            <EditableParagraph id="para-cycle-question-zero-seed" blockId="cycle-question-zero-seed">
                A technician powers up a chip and every cell of its register comes up as 0. The
                stream that follows is{" "}
                <InlineFeedback
                    varName="answer_cycle_zero_seed"
                    correctValue="zeros for ever"
                    position="terminal"
                    successMessage="— exactly, and it is why real hardware is careful to load a non-zero seed"
                    failureMessage="— try that seed on the ring and see where it goes."
                    hint="XOR of zeros is zero, so ask yourself what the next pattern could possibly be"
                    visualizationHint={{
                        blockId: "cycle-visual",
                        hintKey: "feedback-cycle-zero-seed",
                        label: "Start it at all-zeros",
                        steps: [
                            {
                                gesture: "click",
                                label: "Click the 0000 dot at the top of the ring",
                                position: { x: "50%", y: "18%" },
                                completionVar: "cycleSeedValue",
                                completionValue: 0,
                                completionTolerance: 0,
                            },
                            {
                                gesture: "click",
                                label: "Now press the clock a few times and watch how far the marker gets",
                                position: { x: "50%", y: "18%" },
                                completionVar: "cycleCount",
                                completionValue: 3,
                                completionTolerance: 2,
                            },
                        ],
                        resetVars: { cycleSeedValue: 1, cycleCount: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_cycle_zero_seed"
                        correctAnswer="zeros for ever"
                        options={["zeros for ever", "the full fifteen-state loop", "the same stream as any other start"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_cycle_zero_seed'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

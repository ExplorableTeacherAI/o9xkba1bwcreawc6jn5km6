import { type ReactElement, useEffect } from "react";
import { StackLayout, SplitLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InlineClozeInput,
    InlineClozeChoice,
    InlineFeedback,
    InlineTooltip,
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, lerp, useSpring } from "@/lib/motion";
import { LFSR, bitsOfState } from "../lfsrPalette";
import {
    getVariableInfo,
    numberPropsFromDefinition,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
} from "../variables";

// ── Domain model: a 4-bit LFSR tapped at cells 3 and 4 ──────────────────────
// State is held as a number 0-15 so both views read exactly the same value.

const MAX_TICKS = 15;

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

/** Keeps the derived maximal period 2^n - 1 in step with the register degree. */
function MaximalPeriodCalculator() {
    const degree = useVar<number>("registerDegree", 4);
    const setVar = useSetVar();
    useEffect(() => {
        setVar("registerPeriod", Math.pow(2, degree) - 1);
    }, [degree, setVar]);
    return null;
}

// ── View A: the ring of all sixteen states ───────────────────────────────────

const RING_VIEW = 360;
const RING_C = 180;
const R_DOT = 104;
const R_LABEL = 126;

/** The states in the order the register actually visits them, so the walk runs
 *  clockwise round the ring instead of jumping across it. All-zeros is not on
 *  the cycle at all, so it sits alone in the middle. */
const CYCLE: number[] = (() => {
    const order: number[] = [1];
    while (order.length < 16) {
        const following = nextState(order[order.length - 1]);
        if (following === order[0]) break;
        order.push(following);
    }
    return order;
})();

const ringSlot = (state: number) => CYCLE.indexOf(state);
const ringAngle = (state: number) => (-90 + ringSlot(state) * (360 / CYCLE.length)) * (Math.PI / 180);
const ringX = (state: number, radius: number) =>
    ringSlot(state) < 0 ? RING_C : RING_C + radius * Math.cos(ringAngle(state));
const ringY = (state: number, radius: number) =>
    ringSlot(state) < 0 ? RING_C : RING_C + radius * Math.sin(ringAngle(state));

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
            {/* the path the register walks, drawn once as a quiet guide */}
            <circle cx={RING_C} cy={RING_C} r={R_DOT} fill="none" stroke={LFSR.ink} strokeWidth={1} opacity={recede * 0.3} style={EASE} />

            {/* the sixteen states: fifteen on the ring, all-zeros in the middle */}
            <g opacity={recede} style={EASE}>
                {[...CYCLE, 0].map((state) => {
                    const cos = Math.cos(ringAngle(state));
                    const sin = Math.sin(ringAngle(state));
                    const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
                    const onRing = ringSlot(state) >= 0;
                    const labelY = onRing
                        ? ringY(state, R_LABEL) + (sin < -0.35 ? -6 : sin > 0.35 ? 14 : 4)
                        : RING_C + 34;
                    return (
                        <g key={`state-${state}`}>
                            <circle
                                cx={ringX(state, R_DOT)}
                                cy={ringY(state, R_DOT)}
                                r={visited.has(state) ? 7 : 5}
                                fill={visited.has(state) ? LFSR.period : "#FFFFFF"}
                                fillOpacity={visited.has(state) ? 0.55 : 1}
                                stroke={visited.has(state) ? LFSR.period : LFSR.ink}
                                strokeWidth={1.5}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    setVar("cycleSeedValue", state);
                                    setVar("cycleCount", 0);
                                }}
                            />
                            <text
                                x={onRing ? ringX(state, R_LABEL) : RING_C}
                                y={labelY}
                                textAnchor={onRing ? anchor : "middle"}
                                fill={LFSR.ink}
                                fontSize="10"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {bitsOfState(state).join("")}
                            </text>
                        </g>
                    );
                })}
            </g>

            {/* the trail the register has drawn so far */}
            <g opacity={dim("trail")} style={EASE} {...hover("trail")}>
                {isOn("trail") && ticks > 0 && (
                    <polyline points={trailPoints} fill="none" stroke={LFSR.period} strokeWidth={9} opacity={0.28} strokeLinejoin="round" strokeLinecap="round" />
                )}
                {ticks > 0 && (
                    <polyline
                        points={trailPoints}
                        fill="none"
                        stroke={LFSR.period}
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
                    <circle cx={RING_C} cy={RING_C - 13} r={11} fill="none" stroke={LFSR.ink} strokeWidth={9} opacity={0.28} />
                )}
                <circle
                    cx={RING_C}
                    cy={RING_C - 13}
                    r={11}
                    fill="none"
                    stroke={LFSR.ink}
                    strokeWidth={isOn("zerostate") ? 3 : 1.5}
                    style={EASE}
                />
            </g>

            {/* where the register is right now */}
            <g opacity={dim("current")} style={EASE} {...hover("current")}>
                {isOn("current") && <circle cx={markerX} cy={markerY} r={17} fill={LFSR.state} opacity={0.28} />}
                <circle cx={markerX} cy={markerY} r={isOn("current") ? 12 : 10} fill={LFSR.state} stroke="#FFFFFF" strokeWidth={2} style={EASE} />
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
            caption="The fifteen non-zero states in the order the register meets them, so each tick moves one step clockwise. All-zeros sits alone in the middle. Click any dot to start there."
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
    const bits = bitsOfState(current);
    const stream = path.slice(0, path.length - 1).map(outputOf);
    const visited = new Set(path).size;

    return (
        <svg viewBox={`0 0 ${REG_VIEW_W} ${REG_VIEW_H}`} className="block w-full">
            <text x={24} y={22} fill={LFSR.state} fontSize="11" opacity={recede} style={EASE}>
                state
            </text>
            <text
                x={REG_VIEW_W - 24}
                y={22}
                textAnchor="end"
                fill={LFSR.period}
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
                                stroke={LFSR.state}
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
                            stroke={LFSR.state}
                            strokeWidth={isOn("current") ? 4 : 2.5}
                            style={EASE}
                        />
                        <text
                            x={REG_X0 + index * REG_PITCH + REG_CELL_W / 2}
                            y={REG_Y + REG_CELL_H / 2 + 6}
                            textAnchor="middle"
                            fill={LFSR.inkDark}
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
                <text x={24} y={116} fill={LFSR.output} fontSize="11" style={EASE}>
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
                            fill={LFSR.output}
                            fillOpacity={isOn("trail") ? 0.35 : 0.15}
                            stroke={LFSR.output}
                            strokeWidth={isOn("trail") ? 2 : 1.2}
                            style={EASE}
                        />
                        <text
                            x={32 + index * CHIP_PITCH}
                            y={141}
                            textAnchor="middle"
                            fill={LFSR.inkDark}
                            fontSize="11"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {bit}
                        </text>
                    </g>
                ))}
                {stream.length === 0 && (
                    <text x={24} y={141} fill={LFSR.ink} fontSize="11" opacity={0.7}>
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
            caption="The same register, in bits. Each tick pushes one more output bit onto the strip below it."
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
                Four cells hold one of only 2⁴ = 16 patterns, and{" "}
                <InlineLinkedHighlight
                    id="link-cycle-current"
                    varName="cycleHighlight"
                    highlightId="current"
                    color={LFSR.state}
                    bgColor="rgba(172, 139, 249, 0.2)"
                >
                    the state it is in now
                </InlineLinkedHighlight>
                {" "}determines the next one entirely. The register is therefore a deterministic map
                on a finite set, and it cannot wander for ever: the moment it re-enters a state it
                has already visited, it is locked into a cycle.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-zero-trap" maxWidth="xl">
        <Block id="cycle-zero-trap" padding="sm">
            <EditableParagraph id="para-cycle-zero-trap" blockId="cycle-zero-trap">
                One state is a fixed point. XOR a pile of zeros and zero comes back, so{" "}
                <InlineLinkedHighlight
                    id="link-cycle-zerostate"
                    varName="cycleHighlight"
                    highlightId="zerostate"
                    color={LFSR.ink}
                    bgColor="rgba(100, 116, 139, 0.2)"
                >
                    all-zeros
                </InlineLinkedHighlight>
                {" "}feeds itself and leaves at most 15 usable states. When the tap polynomial is{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-cycle-primitive" tooltip="A primitive polynomial of degree n over GF(2) is irreducible and its root generates every non-zero element of GF(2ⁿ), which is exactly what makes the register visit all 2ⁿ − 1 non-zero states.">
                    primitive
                </InlineTooltip>
                {" "}the register reaches every one of them and the output is called an{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-cycle-msequence" tooltip="Maximal-length sequence: the output of an LFSR whose period is the largest possible, 2ⁿ − 1. Its balance, run and autocorrelation statistics closely imitate a random stream.">
                    m-sequence
                </InlineTooltip>
                . Click any pattern to start the register there, or{" "}
                <InlineTrigger
                    id="trigger-cycle-seed-one"
                    varName="cycleSeedValue"
                    value={1}
                    color={LFSR.state}
                    bgColor="rgba(172, 139, 249, 0.15)"
                >
                    start from 0001
                </InlineTrigger>
                {" "}and let it run for{" "}
                <InlineScrubbleNumber
                    varName="cycleCount"
                    {...numberPropsFromDefinition(getVariableInfo('cycleCount'))}
                />
                {" "}ticks while the trail hunts its way home.
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

    <StackLayout key="layout-cycle-period-formula" maxWidth="xl">
        <Block id="cycle-period-formula" padding="lg">
            <MaximalPeriodCalculator key="maximal-period-calculator" />
            <FormulaBlock
                showHint={true}
                latex="\clr{period}{P} = 2^{\scrub{registerDegree}} - 1 = \val{registerPeriod}"
                colorMap={{ period: LFSR.period }}
                variables={{
                    registerDegree: { min: 2, max: 16, step: 1, color: LFSR.degree },
                    registerPeriod: { color: LFSR.period },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-usefulness" maxWidth="xl">
        <Block id="cycle-usefulness" padding="sm">
            <EditableParagraph id="para-cycle-usefulness" blockId="cycle-usefulness">
                Fifteen states give{" "}
                <InlineLinkedHighlight
                    id="link-cycle-trail"
                    varName="cycleHighlight"
                    highlightId="trail"
                    color={LFSR.period}
                    bgColor="rgba(247, 178, 59, 0.2)"
                >
                    fifteen output bits
                </InlineLinkedHighlight>
                , and since eight of the fifteen states end in a 1, the period carries eight
                ones against seven zeros: as balanced as an odd-length window allows. Drag the
                degree above and the period jumps exponentially, yet anyone holding the taps and
                the starting state reproduces every bit of it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-question-five-cells" maxWidth="xl">
        <Block id="cycle-question-five-cells" padding="md">
            <EditableParagraph id="para-cycle-question-five-cells" blockId="cycle-question-five-cells">
                Take a five-cell register with a primitive tap polynomial. One full period of its
                m-sequence contains{" "}
                <InlineFeedback
                    varName="answer_cycle_five_cell_ones"
                    correctValue="16"
                    position="terminal"
                    successMessage="— yes: 31 bits in the period, and the 16 states ending in a 1 supply the ones"
                    failureMessage="— have another think."
                    hint="Half of the 32 patterns end in a 1, and the all-zeros one is not among them"
                    visualizationHint={{
                        blockId: "cycle-visual",
                        hintKey: "feedback-cycle-five-cells",
                        label: "Count it on the four-cell ring first",
                        steps: [
                            {
                                gesture: "click",
                                label: "Tick the four-cell register right round and count the ones on the output strip",
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
                        varName="answer_cycle_five_cell_ones"
                        correctAnswer="16"
                        {...clozePropsFromDefinition(getVariableInfo('answer_cycle_five_cell_ones'))}
                    />
                </InlineFeedback>
                {" "}ones.
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
                    successMessage="— exactly, and it is why real hardware forces a non-zero seed at reset"
                    failureMessage="— try that state on the ring and see where it goes."
                    hint="XOR of zeros is zero, so ask yourself what the next state could possibly be"
                    visualizationHint={{
                        blockId: "cycle-visual",
                        hintKey: "feedback-cycle-zero-seed",
                        label: "Start it at all-zeros",
                        steps: [
                            {
                                gesture: "click",
                                label: "Click the 0000 dot in the middle of the ring",
                                position: { x: "50%", y: "50%" },
                                completionVar: "cycleSeedValue",
                                completionValue: 0,
                                completionTolerance: 0,
                            },
                            {
                                gesture: "click",
                                label: "Now press the clock a few times and watch how far the marker gets",
                                position: { x: "50%", y: "50%" },
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

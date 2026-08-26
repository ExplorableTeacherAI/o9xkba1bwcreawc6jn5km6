import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineScrubbleNumber,
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
    numberPropsFromDefinition,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── Domain model: a 4-bit Fibonacci LFSR tapped at the two right-hand cells ──

const CELL_COUNT = 4;
const TAP_A = 2; // third cell (zero-based)
const TAP_B = 3; // fourth cell
const DEFAULT_SEED = [1, 1, 0, 1];

function stepOnce(bits: number[]): { bits: number[]; output: number } {
    const feedback = bits[TAP_A] ^ bits[TAP_B];
    return { bits: [feedback, ...bits.slice(0, CELL_COUNT - 1)], output: bits[CELL_COUNT - 1] };
}

function stateAfter(seed: number[], ticks: number): { bits: number[]; output: number | null } {
    let bits = seed.slice();
    let output: number | null = null;
    for (let i = 0; i < ticks; i += 1) {
        const result = stepOnce(bits);
        bits = result.bits;
        output = result.output;
    }
    return { bits, output };
}

// ── Drawing geometry ─────────────────────────────────────────────────────────

const VIEW_W = 560;
const VIEW_H = 260;
const PITCH = 70;
const CELL_W = 58;
const CELL_H = 58;
const CELL_X0 = 152;
const CELL_Y = 96;
const PAD = 24;

const INK = "#64748B";
const INK_DARK = "#334155";
const ACCENT = "#62D0AD";
const PARTNER = "#8E90F5";

const cellX = (index: number) => CELL_X0 + index * PITCH;
const cellCenterX = (index: number) => cellX(index) + CELL_W / 2;

function OneClockTickDrawing() {
    const setVar = useSetVar();
    const seedRaw = useVar<number[]>("clockTickSeed", DEFAULT_SEED);
    const ticks = useVar<number>("clockTickCount", 0);
    const highlight = useVar<string>("clockTickHighlight", "");

    const seed = Array.isArray(seedRaw) && seedRaw.length === CELL_COUNT ? seedRaw : DEFAULT_SEED;
    const { bits, output } = stateAfter(seed, ticks);

    // Nothing teleports: the spring lags the tick counter, so the bits slide
    // one cell to the right instead of jumping there.
    const springTicks = useSpring(ticks, { stiffness: 220, damping: 26 });
    const progress = clamp(1 - (ticks - springTicks), 0, 1);
    const slide = -PITCH * (1 - progress);

    const recede = highlight ? 0.38 : 1;
    const dim = (id: string) => (highlight && highlight !== id ? 0.38 : 1);
    const isOn = (id: string) => highlight === id;
    const ease = { transition: "opacity 150ms ease-out, stroke-width 150ms ease-out" };
    const hover = (id: string) => ({
        onPointerEnter: () => setVar("clockTickHighlight", id),
        onPointerLeave: () => setVar("clockTickHighlight", ""),
    });

    const flipCell = (index: number) => {
        const next = bits.slice();
        next[index] = next[index] === 1 ? 0 : 1;
        setVar("clockTickSeed", next);
        setVar("clockTickCount", 0);
    };

    const tapPath = `M ${cellCenterX(TAP_A)} ${CELL_Y + CELL_H} V 196 H ${cellCenterX(TAP_B)} V ${CELL_Y + CELL_H}`;
    const gateX = (cellCenterX(TAP_A) + cellCenterX(TAP_B)) / 2;
    const gateY = 216;
    const feedbackPath = `M ${gateX - 20} ${gateY} H 118 V ${CELL_Y + CELL_H / 2} H 144`;

    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
            {/* readouts, direct-labelled, tabular so they never jitter */}
            <text
                x={PAD}
                y={44}
                fill={INK_DARK}
                fontSize="12"
                opacity={recede}
                style={{ ...ease, fontVariantNumeric: "tabular-nums" }}
            >
                {`register  ${bits.join("")}`}
            </text>
            <text
                x={VIEW_W - PAD}
                y={44}
                textAnchor="end"
                fill={PARTNER}
                fontSize="12"
                opacity={dim("output")}
                style={{ ...ease, fontVariantNumeric: "tabular-nums" }}
                {...hover("output")}
            >
                {`output bit  ${output === null ? "—" : output}`}
            </text>

            {/* cells 1 and 2: plain structure */}
            <g opacity={recede} style={ease}>
                {[0, 1].map((index) => (
                    <rect
                        key={`cell-${index}`}
                        x={cellX(index)}
                        y={CELL_Y}
                        width={CELL_W}
                        height={CELL_H}
                        rx={8}
                        fill="#FFFFFF"
                        stroke={INK}
                        strokeWidth={2}
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
                        fill={INK}
                        fontSize="11"
                    >
                        {index + 1}
                    </text>
                ))}
            </g>

            {/* the tapped cells, the wires that read them, and the XOR gate */}
            <g opacity={dim("taps")} style={ease} {...hover("taps")}>
                {isOn("taps") && (
                    <path d={tapPath} fill="none" stroke={ACCENT} strokeWidth={9} opacity={0.28} strokeLinecap="round" />
                )}
                <path
                    d={tapPath}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth={isOn("taps") ? 4 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={ease}
                />
                {[TAP_A, TAP_B].map((index) => (
                    <rect
                        key={`tapped-${index}`}
                        x={cellX(index)}
                        y={CELL_Y}
                        width={CELL_W}
                        height={CELL_H}
                        rx={8}
                        fill="#FFFFFF"
                        stroke={ACCENT}
                        strokeWidth={isOn("taps") ? 4 : 2.5}
                        style={{ ...ease, cursor: "pointer" }}
                        onClick={() => flipCell(index)}
                    />
                ))}
                <circle
                    cx={gateX}
                    cy={gateY}
                    r={16}
                    fill="#FFFFFF"
                    stroke={ACCENT}
                    strokeWidth={isOn("taps") ? 4 : 2.5}
                    style={ease}
                />
                <line x1={gateX - 11} y1={gateY} x2={gateX + 11} y2={gateY} stroke={ACCENT} strokeWidth={2} />
                <line x1={gateX} y1={gateY - 11} x2={gateX} y2={gateY + 11} stroke={ACCENT} strokeWidth={2} />
                <text x={gateX + 26} y={gateY + 4} fill={ACCENT} fontSize="12">
                    XOR
                </text>
                <text x={gateX} y={182} textAnchor="middle" fill={ACCENT} fontSize="11">
                    tapped
                </text>
            </g>

            {/* the feedback wire carrying the XOR result back to the front cell */}
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
                <text x={210} y={206} textAnchor="middle" fill={ACCENT} fontSize="11">
                    feedback
                </text>
            </g>

            {/* the output line the departing bit leaves along */}
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

            {/* the bits themselves — one moving group, so a tick slides them */}
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

function OneClockTickFigure() {
    const setVar = useSetVar();
    const ticks = useVar<number>("clockTickCount", 0);

    return (
        <Figure
            id="one-clock-tick"
            onReset={() => {
                setVar("clockTickSeed", DEFAULT_SEED);
                setVar("clockTickCount", 0);
            }}
            caption="Four cells, with the two right-hand ones tapped. Click a cell to flip its bit, then press the clock to take a single tick."
        >
            <OneClockTickDrawing />
            <div className="flex items-center justify-center gap-3 px-6 pb-5">
                <button
                    type="button"
                    onClick={() => setVar("clockTickCount", Math.min(ticks + 1, 12))}
                    className="rounded-lg bg-[#62D0AD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4FBE9B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62D0AD]"
                >
                    Clock tick
                </button>
                <span className="text-xs text-[#64748B]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {`${ticks} tick${ticks === 1 ? "" : "s"} taken`}
                </span>
            </div>
            <InteractionHintSequence
                hintKey="one-clock-tick-explore"
                steps={[
                    { gesture: "click", label: "Click a cell to flip its bit", position: { x: "45%", y: "42%" } },
                    { gesture: "click", label: "Press the clock to take one tick", position: { x: "44%", y: "85%" } },
                ]}
            />
        </Figure>
    );
}

export const oneClockTickBlocks: ReactElement[] = [
    <StackLayout key="layout-clock-tick-heading" maxWidth="xl">
        <Block id="clock-tick-heading" padding="md">
            <EditableH2 id="h2-clock-tick-heading" blockId="clock-tick-heading">
                One Clock Tick
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-mechanism" maxWidth="xl">
        <Block id="clock-tick-mechanism" padding="sm">
            <EditableParagraph id="para-clock-tick-mechanism" blockId="clock-tick-mechanism">
                A shift register is a row of cells, each holding one bit. On every clock tick each
                bit slides one place right, the bit at the end drops out as the output, and a gap
                opens at the front. What fills that gap is the whole idea: the XOR of{" "}
                <InlineLinkedHighlight
                    id="link-clock-tick-taps"
                    varName="clockTickHighlight"
                    highlightId="taps"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('clockTickHighlight'))}
                >
                    a few chosen cells
                </InlineLinkedHighlight>
                , fed{" "}
                <InlineLinkedHighlight
                    id="link-clock-tick-feedback"
                    varName="clockTickHighlight"
                    highlightId="feedback"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('clockTickHighlight'))}
                >
                    straight back to the front
                </InlineLinkedHighlight>
                .
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-worked-example" maxWidth="xl">
        <Block id="clock-tick-worked-example" padding="sm">
            <EditableParagraph id="para-clock-tick-worked-example" blockId="clock-tick-worked-example">
                Take 1101, tapped at the two right-hand cells: 0 XOR 1 is 1, so a 1 takes the front
                seat and the register reads 1110. Click any cell below to flip its bit, then press
                the clock and watch the teal bit arrive at the front while the old right-hand bit
                slides off the end.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-visual" maxWidth="xl">
        <Block id="clock-tick-visual" padding="sm" hasVisualization>
            <OneClockTickFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-stream" maxWidth="xl">
        <Block id="clock-tick-stream" padding="sm">
            <EditableParagraph id="para-clock-tick-stream" blockId="clock-tick-stream">
                One tick, one output bit. After{" "}
                <InlineScrubbleNumber
                    varName="clockTickCount"
                    {...numberPropsFromDefinition(getVariableInfo('clockTickCount'))}
                />
                {" "}ticks the stream is that many bits long, fed by nothing but the bits already
                inside. Everything this register will ever emit is settled by the bits you start
                with.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-question-next-state" maxWidth="xl">
        <Block id="clock-tick-question-next-state" padding="md">
            <EditableParagraph id="para-clock-tick-question-next-state" blockId="clock-tick-question-next-state">
                Starting instead from 0110, with the same two taps, one tick later the register
                reads{" "}
                <InlineFeedback
                    varName="answer_clock_tick_next_state"
                    correctValue="1011"
                    position="terminal"
                    successMessage="— exactly: 1 XOR 0 is 1, that 1 takes the front seat, and the old right-hand 0 leaves as the output"
                    failureMessage="— not quite."
                    hint="Read the two right-hand cells while the register still holds 0110, then let everything slide"
                    visualizationHint={{
                        blockId: "clock-tick-visual",
                        hintKey: "feedback-clock-tick-next-state",
                        label: "Work it out on the register",
                        steps: [
                            {
                                gesture: "click",
                                label: "Click the cells until they read 0110, then press the clock once",
                                position: { x: "44%", y: "85%" },
                                completionVar: "clockTickCount",
                                completionValue: 1,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { clockTickCount: 0 },
                    }}
                >
                    <InlineClozeInput
                        varName="answer_clock_tick_next_state"
                        correctAnswer="1011"
                        {...clozePropsFromDefinition(getVariableInfo('answer_clock_tick_next_state'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-question-destination" maxWidth="xl">
        <Block id="clock-tick-question-destination" padding="md">
            <EditableParagraph id="para-clock-tick-question-destination" blockId="clock-tick-question-destination">
                Whatever the tapped cells produce, the XOR gate writes its answer into{" "}
                <InlineFeedback
                    varName="answer_clock_tick_feedback_destination"
                    correctValue="the front cell"
                    position="terminal"
                    successMessage="— right: the tail is where a bit leaves, the front is where the fed-back bit arrives"
                    failureMessage="— have another look at where that teal wire ends."
                    hint="Follow the feedback wire from the gate and see which cell it points into"
                    visualizationHint={{
                        blockId: "clock-tick-visual",
                        hintKey: "feedback-clock-tick-destination",
                        label: "Follow the wire yourself",
                        steps: [
                            {
                                gesture: "click",
                                label: "Press the clock once and watch which end the teal bit appears at",
                                position: { x: "44%", y: "85%" },
                                completionVar: "clockTickCount",
                                completionValue: 1,
                                completionTolerance: 0,
                            },
                            {
                                gesture: "click",
                                label: "Press it again — the new bit always arrives at the same end",
                                position: { x: "44%", y: "85%" },
                                completionVar: "clockTickCount",
                                completionValue: 2,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { clockTickCount: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_clock_tick_feedback_destination"
                        correctAnswer="the front cell"
                        options={["the front cell", "the last cell", "the output line", "both tapped cells"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_clock_tick_feedback_destination'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

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
import { Figure, FigureSlider } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import {
    getVariableInfo,
    numberPropsFromDefinition,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── Domain model: one 4-bit LFSR, run at both ends of the wire ──────────────

const MESSAGE_BITS = 8;

const nextState = (state: number): number => {
    const feedback = ((state >> 1) & 1) ^ (state & 1);
    return (feedback << 3) | (state >> 1);
};

function keystream(seed: number, length: number): number[] {
    const bits: number[] = [];
    let state = seed;
    for (let i = 0; i < length; i += 1) {
        bits.push(state & 1);
        state = nextState(state);
    }
    return bits;
}

const messageBits = (message: number): number[] =>
    Array.from({ length: MESSAGE_BITS }, (_, index) => (message >> (MESSAGE_BITS - 1 - index)) & 1);

const flipBit = (message: number, index: number): number => message ^ (1 << (MESSAGE_BITS - 1 - index));

// ── Shared look ──────────────────────────────────────────────────────────────

const INK = "#64748B";
const INK_DARK = "#334155";
const ACCENT = "#62D0AD";
const PARTNER = "#8E90F5";
const EASE = { transition: "opacity 150ms ease-out, stroke-width 150ms ease-out" };

const VIEW_W = 360;
const VIEW_H = 196;
const CHIP_W = 22;
const CHIP_H = 22;
const CHIP_PITCH = 28;
const CHIP_X0 = 100;
const ROW_TOP = 40;
const ROW_MIDDLE = 92;
const ROW_BOTTOM = 140;

const chipX = (index: number) => CHIP_X0 + index * CHIP_PITCH;

function useSharedHighlight() {
    const highlight = useVar<string>("bothEndsHighlight", "");
    const setVar = useSetVar();
    const isActive = (group: string, index: number) =>
        highlight === group || highlight === `bit-${index}`;
    return {
        highlight,
        isActive,
        opacity: (group: string, index: number) =>
            highlight && !isActive(group, index) ? 0.38 : 1,
        rowOpacity: (group: string) => (highlight && highlight !== group ? 0.38 : 1),
        hoverBit: (index: number) => ({
            onPointerEnter: () => setVar("bothEndsHighlight", `bit-${index}`),
            onPointerLeave: () => setVar("bothEndsHighlight", ""),
        }),
        hoverRow: (group: string) => ({
            onPointerEnter: () => setVar("bothEndsHighlight", group),
            onPointerLeave: () => setVar("bothEndsHighlight", ""),
        }),
    };
}

interface BitRowProps {
    y: number;
    label: string;
    bits: number[];
    group: string;
    color: string;
    filled?: boolean;
    onBitClick?: (index: number) => void;
}

function BitRow({ y, label, bits, group, color, filled = false, onBitClick }: BitRowProps) {
    const { isActive, opacity, rowOpacity, hoverBit, hoverRow } = useSharedHighlight();

    return (
        <g>
            <text
                x={24}
                y={y + CHIP_H / 2 + 4}
                fill={color}
                fontSize="11"
                opacity={rowOpacity(group)}
                style={EASE}
                {...hoverRow(group)}
            >
                {label}
            </text>
            {bits.map((bit, index) => {
                const active = isActive(group, index);
                return (
                    <g
                        key={`${group}-${index}`}
                        opacity={opacity(group, index)}
                        style={{ ...EASE, cursor: onBitClick ? "pointer" : "default" }}
                        onClick={onBitClick ? () => onBitClick(index) : undefined}
                        {...hoverBit(index)}
                    >
                        {active && (
                            <rect
                                x={chipX(index) - 4}
                                y={y - 4}
                                width={CHIP_W + 8}
                                height={CHIP_H + 8}
                                rx={8}
                                fill={color}
                                opacity={0.28}
                            />
                        )}
                        <rect
                            x={chipX(index)}
                            y={y}
                            width={CHIP_W}
                            height={CHIP_H}
                            rx={5}
                            fill={color}
                            fillOpacity={filled ? (active ? 0.35 : 0.15) : 0}
                            stroke={color}
                            strokeWidth={active ? 3 : 1.5}
                            style={EASE}
                        />
                        <text
                            x={chipX(index) + CHIP_W / 2}
                            y={y + CHIP_H / 2 + 5}
                            textAnchor="middle"
                            fill={INK_DARK}
                            fontSize="13"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {bit}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

function XorRule({ y }: { y: number }) {
    return (
        <g opacity={0.9}>
            <text x={80} y={y - 8} textAnchor="middle" fill={INK} fontSize="14">
                +
            </text>
            <line
                x1={CHIP_X0 - 8}
                y1={y}
                x2={chipX(MESSAGE_BITS - 1) + CHIP_W + 8}
                y2={y}
                stroke={INK}
                strokeWidth={1.5}
                strokeLinecap="round"
            />
        </g>
    );
}

// ── View A: the sending end ──────────────────────────────────────────────────

function SenderDrawing() {
    const setVar = useSetVar();
    const message = useVar<number>("bothEndsMessage", 178);
    const seed = useVar<number>("bothEndsSeed", 6);
    const flips = useVar<number>("bothEndsFlips", 0);

    const plain = messageBits(message);
    const stream = keystream(seed, MESSAGE_BITS);
    const sent = plain.map((bit, index) => bit ^ stream[index]);

    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
            <BitRow
                y={ROW_TOP}
                label="message"
                bits={plain}
                group="message"
                color={INK_DARK}
                onBitClick={(index) => {
                    setVar("bothEndsMessage", flipBit(message, index));
                    setVar("bothEndsFlips", flips + 1);
                }}
            />
            <BitRow y={ROW_MIDDLE} label="keystream" bits={stream} group="keystream" color={ACCENT} filled />
            <XorRule y={ROW_BOTTOM - 14} />
            <BitRow y={ROW_BOTTOM} label="sent" bits={sent} group="sent" color={PARTNER} filled />
            <text x={VIEW_W - 24} y={ROW_BOTTOM + CHIP_H / 2 + 4} textAnchor="end" fill={PARTNER} fontSize="13">
                {"→"}
            </text>
        </svg>
    );
}

function SenderFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="scrambler-sender"
            onReset={() => {
                setVar("bothEndsMessage", 178);
                setVar("bothEndsSeed", 6);
                setVar("bothEndsFlips", 0);
            }}
            caption="The sending end: the message, the register's stream, and the scrambled bits that go down the wire. Click a message bit to flip it."
        >
            <SenderDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="bothEndsSeed"
                    label="Shared starting bits"
                    {...numberPropsFromDefinition(getVariableInfo('bothEndsSeed'))}
                    formatValue={(v) => [3, 2, 1, 0].map((shift) => (v >> shift) & 1).join("")}
                />
            </div>
            <InteractionHintSequence
                hintKey="scrambler-sender-flip"
                steps={[{ gesture: "click", label: "Click a message bit to flip it", position: { x: "45%", y: "24%" } }]}
            />
        </Figure>
    );
}

// ── View B: the receiving end ────────────────────────────────────────────────

function ReceiverDrawing() {
    const setVar = useSetVar();
    const message = useVar<number>("bothEndsMessage", 178);
    const seed = useVar<number>("bothEndsSeed", 6);
    const flips = useVar<number>("bothEndsFlips", 0);

    const plain = messageBits(message);
    const stream = keystream(seed, MESSAGE_BITS);
    const arriving = plain.map((bit, index) => bit ^ stream[index]);
    const recovered = arriving.map((bit, index) => bit ^ stream[index]);

    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
            <text x={24} y={ROW_TOP - 14} fill={PARTNER} fontSize="11">
                {"→"}
            </text>
            <BitRow y={ROW_TOP} label="arriving" bits={arriving} group="sent" color={PARTNER} filled />
            <BitRow y={ROW_MIDDLE} label="keystream" bits={stream} group="keystream" color={ACCENT} filled />
            <XorRule y={ROW_BOTTOM - 14} />
            <BitRow
                y={ROW_BOTTOM}
                label="recovered"
                bits={recovered}
                group="message"
                color={INK_DARK}
                onBitClick={(index) => {
                    setVar("bothEndsMessage", flipBit(message, index));
                    setVar("bothEndsFlips", flips + 1);
                }}
            />
        </svg>
    );
}

function ReceiverFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="scrambler-receiver"
            onReset={() => {
                setVar("bothEndsMessage", 178);
                setVar("bothEndsSeed", 6);
                setVar("bothEndsFlips", 0);
            }}
            caption="The receiving end: the same stream is XORed onto the arriving bits, and the message comes back. Clicking a bit at either end changes the message itself."
        >
            <ReceiverDrawing />
            <InteractionHintSequence
                hintKey="scrambler-receiver-hover"
                steps={[{ gesture: "hover", label: "Hover a column to light up the same bit at both ends", position: { x: "45%", y: "24%" } }]}
            />
        </Figure>
    );
}

export const oneStreamBothEndsBlocks: ReactElement[] = [
    <StackLayout key="layout-both-ends-heading" maxWidth="xl">
        <Block id="both-ends-heading" padding="md">
            <EditableH2 id="h2-both-ends-heading" blockId="both-ends-heading">
                One Stream, Both Ends
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-double-xor" maxWidth="xl">
        <Block id="both-ends-double-xor" padding="sm">
            <EditableParagraph id="para-both-ends-double-xor" blockId="both-ends-double-xor">
                XOR a message against the register's stream and it turns into something that looks
                like noise. XOR that noise against{" "}
                <InlineLinkedHighlight
                    id="link-both-ends-keystream"
                    varName="bothEndsHighlight"
                    highlightId="keystream"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('bothEndsHighlight'))}
                >
                    the very same stream
                </InlineLinkedHighlight>
                {" "}and the message walks back out unharmed, because any bit XORed with itself is
                0. Nobody stores the noise: two circuits with the same taps and starting bits
                generate it independently, in step. Click any{" "}
                <InlineLinkedHighlight
                    id="link-both-ends-message"
                    varName="bothEndsHighlight"
                    highlightId="message"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('bothEndsHighlight'))}
                >
                    message bit
                </InlineLinkedHighlight>
                {" "}and follow its column across to the recovered row on the right.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <SplitLayout key="layout-both-ends-visual" ratio="1:1" gap="lg" align="start">
        <Block id="both-ends-visual" padding="sm" hasVisualization>
            <SenderFigure />
        </Block>
        <Block id="both-ends-receiver-view" padding="sm" hasVisualization>
            <ReceiverFigure />
        </Block>
    </SplitLayout>,

    <StackLayout key="layout-both-ends-three-jobs" maxWidth="xl">
        <Block id="both-ends-three-jobs" padding="sm">
            <EditableParagraph id="para-both-ends-three-jobs" blockId="both-ends-three-jobs">
                That single trick covers all three jobs. A scrambler breaks up long runs of
                identical bits so a receiver can keep its timing. A stream cipher keeps the
                starting bits secret and calls them a key. A chip tester exploits the sweep through
                every state to flood a circuit with varied inputs from almost no hardware.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-question-sent-bit" maxWidth="xl">
        <Block id="both-ends-question-sent-bit" padding="md">
            <EditableParagraph id="para-both-ends-question-sent-bit" blockId="both-ends-question-sent-bit">
                A message bit of 1 meets a keystream bit of 1, so the bit that actually travels
                down the wire is{" "}
                <InlineFeedback
                    varName="answer_both_ends_sent_bit"
                    correctValue="0"
                    position="terminal"
                    successMessage="— right, and XORing that 0 with the same keystream 1 at the far end brings the 1 straight back"
                    failureMessage="— not quite."
                    hint="1 XOR 1 is the case where XOR gives you zero"
                    visualizationHint={{
                        blockId: "both-ends-visual",
                        hintKey: "feedback-both-ends-sent-bit",
                        label: "Find that column yourself",
                        steps: [
                            {
                                gesture: "click",
                                label: "Flip message bits until a 1 sits above a keystream 1, then read the sent bit underneath",
                                position: { x: "45%", y: "24%" },
                                completionVar: "bothEndsFlips",
                                completionValue: 1,
                                completionTolerance: 0,
                            },
                        ],
                        resetVars: { bothEndsMessage: 178, bothEndsSeed: 6, bothEndsFlips: 0 },
                    }}
                >
                    <InlineClozeInput
                        varName="answer_both_ends_sent_bit"
                        correctAnswer="0"
                        {...clozePropsFromDefinition(getVariableInfo('answer_both_ends_sent_bit'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-question-shared" maxWidth="xl">
        <Block id="both-ends-question-shared" padding="md">
            <EditableParagraph id="para-both-ends-question-shared" blockId="both-ends-question-shared">
                Two ends of a link can build the very same keystream without ever sending it to
                each other, because what they agree on in advance is{" "}
                <InlineFeedback
                    varName="answer_both_ends_shared"
                    correctValue="the taps and the starting bits"
                    position="terminal"
                    successMessage="— exactly, and that is the whole reason a few secret bits can stand in for a stream of any length"
                    failureMessage="— think about what each end actually needs to generate the stream on its own."
                    hint="Both ends run identical hardware, so the only things they must match are the wiring and where they begin"
                    visualizationHint={{
                        blockId: "both-ends-visual",
                        hintKey: "feedback-both-ends-shared",
                        label: "Change what they share",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the shared starting bits and watch both keystreams change together",
                                position: { x: "50%", y: "82%" },
                                completionVar: "bothEndsSeed",
                                completionValue: 11,
                                completionTolerance: 3,
                            },
                        ],
                        resetVars: { bothEndsMessage: 178, bothEndsSeed: 6, bothEndsFlips: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_both_ends_shared"
                        correctAnswer="the taps and the starting bits"
                        options={["the taps and the starting bits", "the message itself", "the scrambled bits", "a stored table of noise"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_both_ends_shared'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

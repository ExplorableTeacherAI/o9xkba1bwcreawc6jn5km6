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
    InlineTooltip,
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { LFSR } from "../lfsrPalette";
import {
    getVariableInfo,
    numberPropsFromDefinition,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
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
                            fill={LFSR.inkDark}
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
            <text x={80} y={y - 8} textAnchor="middle" fill={LFSR.ink} fontSize="14">
                ⊕
            </text>
            <line
                x1={CHIP_X0 - 8}
                y1={y}
                x2={chipX(MESSAGE_BITS - 1) + CHIP_W + 8}
                y2={y}
                stroke={LFSR.ink}
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
                label="message m"
                bits={plain}
                group="message"
                color={LFSR.message}
                filled
                onBitClick={(index) => {
                    setVar("bothEndsMessage", flipBit(message, index));
                    setVar("bothEndsFlips", flips + 1);
                }}
            />
            <BitRow y={ROW_MIDDLE} label="keystream z" bits={stream} group="keystream" color={LFSR.output} filled />
            <XorRule y={ROW_BOTTOM - 14} />
            <BitRow y={ROW_BOTTOM} label="sent c" bits={sent} group="sent" color={LFSR.cipher} filled />
            <text x={VIEW_W - 24} y={ROW_BOTTOM + CHIP_H / 2 + 4} textAnchor="end" fill={LFSR.cipher} fontSize="13">
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
            caption="The sending end: the message, the register's keystream, and the ciphertext that goes down the wire. Click a message bit to flip it."
        >
            <SenderDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="bothEndsSeed"
                    label="Shared starting state"
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
            <text x={24} y={ROW_TOP - 14} fill={LFSR.cipher} fontSize="11">
                {"→"}
            </text>
            <BitRow y={ROW_TOP} label="arriving c" bits={arriving} group="sent" color={LFSR.cipher} filled />
            <BitRow y={ROW_MIDDLE} label="keystream z" bits={stream} group="keystream" color={LFSR.output} filled />
            <XorRule y={ROW_BOTTOM - 14} />
            <BitRow
                y={ROW_BOTTOM}
                label="recovered m"
                bits={recovered}
                group="message"
                color={LFSR.message}
                filled
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
            caption="The receiving end: the same keystream is XORed onto the arriving bits and the message comes back. Clicking a bit at either end changes the message itself."
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
                XOR a message against the register's output and you have an{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-both-ends-additive" tooltip="An additive stream cipher combines each plaintext bit with a keystream bit using XOR alone. Its security rests entirely on the keystream, since the combining step is public and reversible.">
                    additive stream cipher
                </InlineTooltip>
                . XOR the ciphertext against{" "}
                <InlineLinkedHighlight
                    id="link-both-ends-keystream"
                    varName="bothEndsHighlight"
                    highlightId="keystream"
                    color={LFSR.output}
                    bgColor="rgba(142, 144, 245, 0.2)"
                >
                    the very same keystream
                </InlineLinkedHighlight>
                {" "}and the message walks back out unharmed, because XOR is its own inverse.
                Nobody transmits the keystream: two circuits holding the same taps and the same
                starting state generate it independently, in step.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-identity" maxWidth="xl">
        <Block id="both-ends-identity" padding="lg">
            <FormulaBlock
                latex="\clr{cipher}{c} = \clr{message}{m} \oplus \clr{keystream}{z} \qquad \clr{cipher}{c} \oplus \clr{keystream}{z} = \clr{message}{m} \oplus \clr{keystream}{z} \oplus \clr{keystream}{z} = \clr{message}{m}"
                colorMap={{ message: LFSR.message, keystream: LFSR.output, cipher: LFSR.cipher }}
            />
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

    <StackLayout key="layout-both-ends-explore" maxWidth="xl">
        <Block id="both-ends-explore" padding="sm">
            <EditableParagraph id="para-both-ends-explore" blockId="both-ends-explore">
                Click any{" "}
                <InlineLinkedHighlight
                    id="link-both-ends-message"
                    varName="bothEndsHighlight"
                    highlightId="message"
                    color={LFSR.message}
                    bgColor="rgba(248, 160, 205, 0.2)"
                >
                    pink message bit
                </InlineLinkedHighlight>
                {" "}and follow its column across to the recovered row on the right, then{" "}
                <InlineTrigger
                    id="trigger-both-ends-seed"
                    varName="bothEndsSeed"
                    value={11}
                    color={LFSR.state}
                    bgColor="rgba(172, 139, 249, 0.15)"
                >
                    change the shared state to 1011
                </InlineTrigger>
                {" "}and watch both keystreams rewrite together while the recovered message stays
                put.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-three-jobs" maxWidth="xl">
        <Block id="both-ends-three-jobs" padding="sm">
            <EditableParagraph id="para-both-ends-three-jobs" blockId="both-ends-three-jobs">
                One circuit, three jobs. A scrambler breaks up long runs of identical bits so the
                receiver's{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-both-ends-clock-recovery" tooltip="Clock recovery is how a receiver extracts timing from the data edges themselves. A long run of identical bits starves it of edges, so standards scramble the payload against a PRBS such as the 2^7 - 1 or 2^31 - 1 sequences.">
                    clock recovery
                </InlineTooltip>
                {" "}keeps lock. A stream cipher keeps the starting state secret and calls it a key.
                A built-in self-test generator exploits the sweep through every state to flood a
                circuit with varied inputs from almost no silicon.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-question-involution" maxWidth="xl">
        <Block id="both-ends-question-involution" padding="md">
            <EditableParagraph id="para-both-ends-question-involution" blockId="both-ends-question-involution">
                Decryption works because the middle of that identity collapses. Fill in what the
                keystream cancels to:
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-formula-choice" maxWidth="xl">
        <Block id="both-ends-formula-choice" padding="lg">
            <FormulaBlock
                showHint={true}
                latex="\clr{keystream}{z} \oplus \clr{keystream}{z} = \choice{answer_both_ends_involution}"
                colorMap={{ keystream: LFSR.output }}
                clozeChoices={{
                    answer_both_ends_involution: {
                        correctAnswer: '0',
                        options: ['0', '1', 'z', 'm'],
                        placeholder: '???',
                        color: LFSR.output,
                    },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-question-sent-bit" maxWidth="xl">
        <Block id="both-ends-question-sent-bit" padding="md">
            <EditableParagraph id="para-both-ends-question-sent-bit" blockId="both-ends-question-sent-bit">
                A message bit of 1 meets a keystream bit of 1, so the ciphertext bit that travels
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
                                label: "Flip message bits until a 1 sits above a keystream 1, then read the ciphertext bit underneath",
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
                    correctValue="the taps and the starting state"
                    position="terminal"
                    successMessage="— exactly, and that is why a handful of secret bits can stand in for a stream of any length"
                    failureMessage="— think about what each end actually needs to generate the stream on its own."
                    hint="Both ends run identical hardware, so the only things they must match are the tap polynomial and the seed"
                    visualizationHint={{
                        blockId: "both-ends-visual",
                        hintKey: "feedback-both-ends-shared",
                        label: "Change what they share",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the shared starting state and watch both keystreams change together",
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
                        correctAnswer="the taps and the starting state"
                        options={["the taps and the starting state", "the message itself", "the scrambled bits", "a stored table of noise"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_both_ends_shared'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

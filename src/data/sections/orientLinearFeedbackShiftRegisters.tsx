import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH1, EditableParagraph, InlineTooltip, InlineSpotColor } from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { LFSR } from "../lfsrPalette";

// ── A quiet opening illustration: two people, one shared little circuit ──────

const SCRAMBLED = [1, 0, 0, 1, 1, 1, 0, 1];
const PLAIN = "10110010";
const CHIP_W = 20;
const CHIP_PITCH = 26;
const CHIP_X0 = 179;

function personGroup(centreX: number, label: string) {
    return (
        <g key={label}>
            {/* speech bubble holding the readable message */}
            <rect x={centreX - 54} y={18} width={108} height={34} rx={10} fill="#FFFFFF" stroke={LFSR.message} strokeWidth={1.5} />
            <path d={`M ${centreX - 7} 52 L ${centreX} 62 L ${centreX + 7} 52 Z`} fill="#FFFFFF" stroke={LFSR.message} strokeWidth={1.5} />
            <text
                x={centreX}
                y={41}
                textAnchor="middle"
                fill={LFSR.inkDark}
                fontSize="13"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {PLAIN}
            </text>

            {/* the person */}
            <circle cx={centreX} cy={86} r={19} fill={LFSR.paper} stroke={LFSR.ink} strokeWidth={2} />
            <path
                d={`M ${centreX - 26} 154 v -18 a 26 26 0 0 1 52 0 v 18 Z`}
                fill={LFSR.paper}
                stroke={LFSR.ink}
                strokeWidth={2}
                strokeLinejoin="round"
            />
            <text x={centreX} y={176} textAnchor="middle" fill={LFSR.ink} fontSize="11">
                {label}
            </text>

            {/* the little register each of them runs */}
            {[0, 1, 2, 3].map((index) => (
                <rect
                    key={`${label}-cell-${index}`}
                    x={centreX - 34 + index * 18}
                    y={190}
                    width={14}
                    height={14}
                    rx={3}
                    fill={LFSR.tap}
                    fillOpacity={0.18}
                    stroke={LFSR.tap}
                    strokeWidth={1.5}
                />
            ))}
        </g>
    );
}

function SecureLinkIllustration() {
    return (
        <svg viewBox="0 0 560 232" className="block w-full">
            {personGroup(86, "sender")}
            {personGroup(474, "receiver")}

            {/* the wire between them */}
            <line x1={130} y1={128} x2={424} y2={128} stroke={LFSR.ink} strokeWidth={1.5} strokeLinecap="round" />
            <path d="M 424 122 L 434 128 L 424 134 Z" fill={LFSR.ink} />

            <text x={280} y={106} textAnchor="middle" fill={LFSR.cipher} fontSize="11">
                what travels down the wire
            </text>
            {SCRAMBLED.map((bit, index) => (
                <g key={`scrambled-${index}`}>
                    <rect
                        x={CHIP_X0 + index * CHIP_PITCH}
                        y={118}
                        width={CHIP_W}
                        height={20}
                        rx={5}
                        fill={LFSR.cipher}
                        fillOpacity={0.15}
                        stroke={LFSR.cipher}
                        strokeWidth={1.5}
                    />
                    <text
                        x={CHIP_X0 + index * CHIP_PITCH + CHIP_W / 2}
                        y={132}
                        textAnchor="middle"
                        fill={LFSR.inkDark}
                        fontSize="12"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {bit}
                    </text>
                </g>
            ))}

            <text x={280} y={200} textAnchor="middle" fill={LFSR.tap} fontSize="11">
                same taps, same starting state
            </text>
        </svg>
    );
}

export const orientLinearFeedbackShiftRegistersBlocks: ReactElement[] = [
    <StackLayout key="layout-orient-title" maxWidth="xl">
        <Block id="orient-title" padding="md">
            <EditableH1 id="h1-orient-title" blockId="orient-title">
                Linear Feedback Shift Registers
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-hook" maxWidth="xl">
        <Block id="orient-hook" padding="sm">
            <EditableParagraph id="para-orient-hook" blockId="orient-hook">
                Every Wi-Fi packet your phone sends goes out scrambled. Not encrypted, just
                scrambled: the transmitter XORs the payload against a{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-orient-prbs" tooltip="Pseudo-random binary sequence: a bit stream that passes statistical tests for randomness yet is produced by a deterministic rule, so it can be regenerated exactly.">
                    pseudo-random binary sequence
                </InlineTooltip>
                , and the receiver XORs the identical sequence back off it. That sequence is not
                noise. It falls out of a handful of{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-orient-flipflop" tooltip="A one-bit memory element that copies its input to its output on the edge of a clock signal. A row of them is a shift register.">
                    flip-flops
                </InlineTooltip>
                {" "}and one XOR gate, cheap enough to put in everything. It is called a linear
                feedback shift register.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-illustration" maxWidth="xl">
        <Block id="orient-illustration" padding="sm" hasVisualization>
            <Figure
                id="secure-link"
                caption="Two people, the same message at both ends, and something quite unreadable in between. Each of them runs the same small circuit."
            >
                <SecureLinkIllustration />
            </Figure>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-promise" maxWidth="xl">
        <Block id="orient-promise" padding="sm">
            <EditableParagraph id="para-orient-promise" blockId="orient-promise">
                Here we build one cell by cell and read off its algebra: the{" "}
                <InlineSpotColor varName="xorWiringTapMask" color={LFSR.tap}>tap polynomial</InlineSpotColor>
                {" "}that defines the circuit, and the{" "}
                <InlineSpotColor varName="registerPeriod" color={LFSR.period}>period</InlineSpotColor>
                {" "}of the sequence it emits. Then we work out why one cheap circuit earns three
                jobs: scrambling a transmission, exercising a chip on the test bench, and keying a
                stream cipher. If you can read a string of bits and you know that 1 XOR 1 is 0, you
                have everything you need to start.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

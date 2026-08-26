import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                bit slides one place to the right, the bit at the right-hand end drops out as the
                output, and a gap opens at the left. What fills that gap is the whole idea: in a
                linear feedback shift register it is the XOR of a few chosen cells, fed straight
                back to the front.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-clock-tick-worked-example" maxWidth="xl">
        <Block id="clock-tick-worked-example" padding="sm">
            <EditableParagraph id="para-clock-tick-worked-example" blockId="clock-tick-worked-example">
                Take the four bits 1101, feeding back from the two right-hand cells. The output on
                this tick is the rightmost 1. The feedback bit is 0 XOR 1, so a 1 slides into the
                front and the register now reads 1110.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="clock-tick-visual" id="clock-tick-visual">
        <VisualOptionCards
            blockId="clock-tick-visual"
            cards={[
                {
                    id: "clock-step-register",
                    title: "A row of four bit cells with a clock button beneath it",
                    looks: "Imagine four square cells in a row, each showing a 0 or a 1, with a wire leaving the two right-hand cells, meeting at a small XOR symbol and curving back round to the front cell. Pressing the clock slides every bit one place right, one step at a time.",
                    manipulate: "Click any cell to flip its bit, then press the clock button to take a single tick and watch the bits move across",
                    reveals: "Each tick does only two things: one bit leaves at the right, and the XOR of the tapped cells enters at the left.",
                    paradigm: "temporal",
                    recommended: true,
                },
                {
                    id: "predict-incoming-bit",
                    title: "A register with the front cell left empty, waiting for the next bit",
                    looks: "Imagine the same row of four cells, but the front one is blank and outlined, and two loose 0 and 1 tiles sit just above it. The tapped cells are marked, and once a tile is dropped in the circuit shows what the XOR actually produced.",
                    manipulate: "Drag a 0 or a 1 tile into the empty front cell to say what they think the feedback bit will be, then release the tick to see the real answer",
                    reveals: "The incoming bit is never a free choice: it is forced by the bits sitting in the tapped cells right now.",
                    targetsMisconception: "Students get confused about which bits feed the XOR and where its result goes",
                    paradigm: "prediction",
                },
                {
                    id: "register-and-output-tape",
                    title: "A register beside the growing strip of bits it has already pushed out",
                    looks: "Imagine the four cells on the left and, running away to the right, a paper tape that gains one more bit every tick. Stepping the clock slides the register and stamps the bit that just fell out onto the end of the tape, so the whole history stays on screen.",
                    manipulate: "Set the starting bits by clicking the cells, then step the clock repeatedly and watch each departing bit land on the tape",
                    reveals: "The stream on the tape is nothing but the register's right-hand cell, read out one tick after another.",
                    paradigm: "comparison",
                    secondView: {
                        shows: "The output tape: every bit that has left the register so far, in order",
                        role: "complementary",
                        syncedBy: "the shared register state and tick count, plus a hover highlight linking a tape bit to the cell it came from",
                    },
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-clock-tick-stream" maxWidth="xl">
        <Block id="clock-tick-stream" padding="sm">
            <EditableParagraph id="para-clock-tick-stream" blockId="clock-tick-stream">
                One tick gives one output bit. Repeat it and a stream pours out, with nothing
                feeding the circuit but the bits already inside it. Everything this register will
                ever emit is settled the moment you choose the bits you start with.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];

import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                The XOR gate is the easy part. What trips people up is which cells feed it and
                where its answer lands, and two rules settle both. The tapped cells are read while
                the register still holds the old bits, before anything moves. The result then
                enters at the front, never at the tail where the output leaves.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-xor-wiring-worked-example" maxWidth="xl">
        <Block id="xor-wiring-worked-example" padding="sm">
            <EditableParagraph id="para-xor-wiring-worked-example" blockId="xor-wiring-worked-example">
                So with 1011 tapped at the first and last cells, read those two first: 1 XOR 1 is
                0. The right-hand 1 leaves as output, the rest slide across, and the 0 takes the
                front seat, giving 0101.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="xor-wiring-visual" id="xor-wiring-visual">
        <VisualOptionCards
            blockId="xor-wiring-visual"
            cards={[
                {
                    id: "wire-the-taps",
                    title: "A register with loose wires that can be attached to any cell",
                    looks: "Imagine four bit cells in a row with an XOR symbol below them and a feedback wire curling from that symbol back to the front cell. Loose wire ends hang under each cell, and clipping one to the XOR marks that cell as tapped and immediately changes the bit the circuit feeds back.",
                    manipulate: "Clip wires from any cells they choose onto the XOR gate, then step the clock and read the bit that arrives at the front",
                    reveals: "The feedback bit is decided entirely by the cells that are wired in, read before the shift happens.",
                    targetsMisconception: "Students get confused about which bits feed the XOR and where its result goes",
                    paradigm: "constructivist",
                    recommended: true,
                },
                {
                    id: "match-the-next-state",
                    title: "A register showing the state it must reach on the next tick",
                    looks: "Imagine the current four bits on top and, faintly beneath them, the state the register is required to arrive at. Wires from the cells to the XOR gate can be switched on and off, and the faint target fills in solidly as soon as the wiring produces it.",
                    manipulate: "Switch taps on and off until the tick lands exactly on the required next state",
                    reveals: "Only certain tap choices can produce a given next bit, so the wiring is not a free decoration.",
                    paradigm: "inversion",
                },
                {
                    id: "two-registers-same-seed",
                    title: "Two identical registers with the same starting bits but different taps",
                    looks: "Imagine two rows of four cells, one above the other, holding exactly the same bits at the start. Each has its own XOR wiring, and one shared clock steps them together while both write their output bits onto strips running out to the right.",
                    manipulate: "Change the taps on the lower register, then step the shared clock and compare the two strips as they grow",
                    reveals: "Identical starting bits give completely different streams once the taps differ, so the taps are half the design.",
                    paradigm: "comparison",
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-xor-wiring-consequence" maxWidth="xl">
        <Block id="xor-wiring-consequence" padding="sm">
            <EditableParagraph id="para-xor-wiring-consequence" blockId="xor-wiring-consequence">
                Move a tap and the whole stream changes, even from the same starting bits. Which
                raises the awkward question: with only sixteen possible four-bit states, how long
                can such a stream keep surprising us?
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
